import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static String _url = const String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static String _anonKey = const String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  static String _apiBaseUrl = const String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://victorio-abc-ph.vercel.app/api/v1',
  );

  static String currentRole = 'patient';
  static String currentUserName = 'Patient';
  static String? currentBranchId;

  static String get url => _url;
  static String get anonKey => _anonKey;
  static String get apiBaseUrl => _apiBaseUrl;

  static bool get isStaffRole =>
      currentRole == 'doctor' ||
      currentRole == 'nurse' ||
      currentRole == 'reception' ||
      currentRole == 'admin';

  static bool get isConfigured =>
      _url.isNotEmpty &&
      _anonKey.isNotEmpty &&
      !_url.contains('your-project-ref') &&
      !_anonKey.contains('your-supabase-anon-key');

  static Future<void> _loadEnvAsset() async {
    try {
      final raw = await rootBundle.loadString('.env');
      for (final line in const LineSplitter().convert(raw)) {
        final trimmed = line.trim();
        if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
        final idx = trimmed.indexOf('=');
        if (idx <= 0) continue;
        final key = trimmed.substring(0, idx).trim();
        final value = trimmed.substring(idx + 1).trim();
        if (key == 'SUPABASE_URL' && _url.isEmpty && value.isNotEmpty) {
          _url = value;
        } else if (key == 'SUPABASE_ANON_KEY' && _anonKey.isEmpty && value.isNotEmpty) {
          _anonKey = value;
        } else if (key == 'API_BASE_URL' && value.isNotEmpty) {
          _apiBaseUrl = value;
        }
      }
    } catch (_) {
      // Fallback to compile-time environment values if .env asset is absent in unit tests
    }
  }

  static Future<void> initialize() async {
    await _loadEnvAsset();
    if (!isConfigured) return;
    try {
      await Supabase.initialize(
        url: _url,
        publishableKey: _anonKey,
      );
      await refreshUserProfile();
    } catch (_) {
      // Already initialized or offline
    }
  }

  static Future<void> refreshUserProfile() async {
    if (!isConfigured) return;
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        currentRole = 'patient';
        currentUserName = 'Patient';
        currentBranchId = null;
        return;
      }

      final metaRole = user.userMetadata?['role']?.toString();
      final metaName = user.userMetadata?['full_name']?.toString();

      final profile = await Supabase.instance.client
          .from('profiles')
          .select('role, full_name, branch_id')
          .eq('id', user.id)
          .maybeSingle();

      currentRole = (profile?['role']?.toString() ?? metaRole ?? 'patient').toLowerCase();
      currentUserName = profile?['full_name']?.toString() ?? metaName ?? user.email ?? 'User';
      currentBranchId = profile?['branch_id']?.toString();
    } catch (_) {
      // Keep fallback role
    }
  }

  static Map<String, String> _buildAuthHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (isConfigured) {
      final token = Supabase.instance.client.auth.currentSession?.accessToken;
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static Future<Map<String, dynamic>> getApi(
    String path, {
    Map<String, String>? queryParameters,
  }) async {
    final base = _apiBaseUrl.endsWith('/')
        ? _apiBaseUrl.substring(0, _apiBaseUrl.length - 1)
        : _apiBaseUrl;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$base$cleanPath').replace(queryParameters: queryParameters);

    final response = await http
        .get(uri, headers: _buildAuthHeaders())
        .timeout(const Duration(seconds: 15));

    final decoded = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded is Map<String, dynamic> ? decoded : {'data': decoded};
    }
    final msg = decoded is Map ? (decoded['message']?.toString() ?? 'Request failed') : 'Request failed';
    throw Exception(msg);
  }

  static Future<Map<String, dynamic>> postApi(
    String path,
    Map<String, dynamic> body,
  ) async {
    final base = _apiBaseUrl.endsWith('/')
        ? _apiBaseUrl.substring(0, _apiBaseUrl.length - 1)
        : _apiBaseUrl;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$base$cleanPath');

    final response = await http
        .post(uri, headers: _buildAuthHeaders(), body: jsonEncode(body))
        .timeout(const Duration(seconds: 15));

    final decoded = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded is Map<String, dynamic> ? decoded : {'data': decoded};
    }
    final msg = decoded is Map ? (decoded['message']?.toString() ?? 'Request failed') : 'Request failed';
    throw Exception(msg);
  }

  static Future<Map<String, dynamic>> patchApi(
    String path,
    Map<String, dynamic> body,
  ) async {
    final base = _apiBaseUrl.endsWith('/')
        ? _apiBaseUrl.substring(0, _apiBaseUrl.length - 1)
        : _apiBaseUrl;
    final cleanPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$base$cleanPath');

    final response = await http
        .patch(uri, headers: _buildAuthHeaders(), body: jsonEncode(body))
        .timeout(const Duration(seconds: 15));

    final decoded = jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded is Map<String, dynamic> ? decoded : {'data': decoded};
    }
    final msg = decoded is Map ? (decoded['message']?.toString() ?? 'Request failed') : 'Request failed';
    throw Exception(msg);
  }
}
