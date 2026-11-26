import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:victorio_abc_mobile/core/config/supabase_config.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';
import 'package:victorio_abc_mobile/shared/widgets/disclaimer_banner.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/primary_button.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _queueSummary = const {
    'total': 0,
    'Waiting': 0,
    'Triage': 0,
    'For Doctor Order': 0,
    'For Vaccination': 0,
    'Completed': 0,
  };
  List<dynamic> _queueItems = const [];
  Map<String, dynamic>? _patientRecord;

  final _qrCheckInCtrl = TextEditingController();
  bool _checkingIn = false;

  @override
  void initState() {
    super.initState();
    _loadWorkspaceData();
  }

  @override
  void dispose() {
    _qrCheckInCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadWorkspaceData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    if (!SupabaseConfig.isConfigured) {
      setState(() => _loading = false);
      return;
    }

    try {
      await SupabaseConfig.refreshUserProfile();
      if (SupabaseConfig.isStaffRole) {
        final res = await SupabaseConfig.getApi('/triage/queue');
        final data = res['data'] as Map<String, dynamic>? ?? {};
        setState(() {
          _queueSummary =
              (data['summary'] as Map<String, dynamic>?) ?? _queueSummary;
          _queueItems = (data['items'] as List<dynamic>?) ?? const [];
        });
      } else {
        final res = await SupabaseConfig.getApi('/patients');
        final list = (res['data'] as List<dynamic>?) ?? const [];
        setState(() {
          _patientRecord =
              list.isNotEmpty ? (list.first as Map<String, dynamic>) : null;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleStaffQrCheckIn() async {
    final token = _qrCheckInCtrl.text.trim();
    if (token.isEmpty) return;
    setState(() => _checkingIn = true);
    try {
      final res = await SupabaseConfig.postApi('/triage/check-in', {
        'qr_code_hash': token,
        'chief_complaint': 'Mobile staff QR check-in',
      });
      final created = res['data'] as Map<String, dynamic>? ?? {};
      final queueNum =
          (created['clinical_context'] as Map<String, dynamic>?)?['queue_number'] ??
              'Waiting';
      _qrCheckInCtrl.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.navy,
            content: Text('Patient checked into queue as $queueNum.'),
          ),
        );
      }
      await _loadWorkspaceData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.danger,
            content: Text(e.toString().replaceFirst('Exception: ', '')),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _checkingIn = false);
    }
  }

  Widget _buildSkeletonCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 160,
            height: 16,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(6),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            height: 12,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(6),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 220,
            height: 12,
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(6),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isStaff = SupabaseConfig.isStaffRole;

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadWorkspaceData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, ${SupabaseConfig.currentUserName}',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isStaff
                          ? 'Clinical Staff Mobile Queue & QR Check-In Workspace'
                          : 'Your multi-branch rabies post-exposure prophylaxis (PEP) companion.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _loadWorkspaceData,
                icon: const Icon(Icons.refresh_rounded, color: AppColors.navy),
                tooltip: 'Refresh',
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loading) ...[
            _buildSkeletonCard(),
            const SizedBox(height: 12),
            _buildSkeletonCard(),
          ] else if (_error != null) ...[
            InfoCard(
              title: 'Sync Notice',
              trailing: const StatusBadge(label: 'Retry Available', tone: BadgeTone.amber),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _error!,
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  PrimaryButton(
                    label: 'Retry Connection',
                    icon: Icons.refresh_rounded,
                    onPressed: _loadWorkspaceData,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],
          if (!_loading && isStaff) ...[
            InfoCard(
              title: 'Quick QR Patient Check-In',
              subtitle: 'Enter or scan a VABC patient token to add to branch queue',
              trailing: const StatusBadge(label: 'Live Queue', tone: BadgeTone.teal),
              child: Column(
                children: [
                  TextField(
                    controller: _qrCheckInCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Patient QR Token (e.g. VABC-...)',
                      prefixIcon: Icon(Icons.qr_code_scanner_rounded),
                    ),
                  ),
                  const SizedBox(height: 12),
                  PrimaryButton(
                    label: 'Check In Patient to Queue',
                    icon: Icons.how_to_reg_rounded,
                    isLoading: _checkingIn,
                    onPressed: _handleStaffQrCheckIn,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            InfoCard(
              title: 'Live Clinic Visit Status Summary',
              subtitle: 'Active branch queue breakdown',
              trailing: StatusBadge(
                label: 'Total: ${_queueSummary['total'] ?? 0}',
                tone: BadgeTone.blue,
              ),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  StatusBadge(
                    label: 'Waiting: ${_queueSummary['Waiting'] ?? 0}',
                    tone: BadgeTone.amber,
                  ),
                  StatusBadge(
                    label: 'Triage: ${_queueSummary['Triage'] ?? 0}',
                    tone: BadgeTone.blue,
                  ),
                  StatusBadge(
                    label:
                        'For Doctor Order: ${_queueSummary['For Doctor Order'] ?? 0}',
                    tone: BadgeTone.red,
                  ),
                  StatusBadge(
                    label:
                        'For Vaccination: ${_queueSummary['For Vaccination'] ?? 0}',
                    tone: BadgeTone.teal,
                  ),
                  StatusBadge(
                    label: 'Completed: ${_queueSummary['Completed'] ?? 0}',
                    tone: BadgeTone.emerald,
                  ),
                ],
              ),
            ),
            if (_queueItems.isNotEmpty) ...[
              const SizedBox(height: 14),
              InfoCard(
                title: 'Recent Queue Visits (${_queueItems.length})',
                subtitle: 'Tap Schedules or Triage tabs below for detailed actions',
                child: Column(
                  children: _queueItems.take(5).map((item) {
                    final map = item as Map<String, dynamic>;
                    final patient = map['patient'] as Map<String, dynamic>? ?? {};
                    final ctx =
                        map['clinical_context'] as Map<String, dynamic>? ?? {};
                    final visitStatus = map['visit_status']?.toString() ?? 'Waiting';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.navy,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              ctx['queue_number']?.toString() ?? 'VISIT',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  patient['full_name']?.toString() ?? 'Patient',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.titleSmall,
                                ),
                                Text(
                                  '${map['animal_type'] ?? 'Animal'} • ${map['bite_site'] ?? 'Exposure'}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          StatusBadge(label: visitStatus, tone: BadgeTone.teal),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ] else if (!_loading) ...[
            InfoCard(
              title: _patientRecord != null
                  ? 'Active Patient Profile: ${_patientRecord!['full_name']}'
                  : 'Next PEP Vaccination & QR Pass',
              subtitle: _patientRecord != null
                  ? 'QR Token: ${_patientRecord!['qr_code_hash']} • Brgy. ${_patientRecord!['barangay']}'
                  : 'Active Treatment Tracker',
              trailing: const StatusBadge(label: 'Verified', tone: BadgeTone.teal),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _patientRecord != null
                        ? 'Present your digital QR Pass at any Victorio ABC branch in San Jose del Monte for instant check-in and cross-branch PEP dose logging.'
                        : 'Start an AI Wound Pre-Triage assessment or open your personal Digital QR Pass for clinic check-in.',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 14),
                  PrimaryButton(
                    label: 'Open Digital Clinic QR Pass',
                    icon: Icons.qr_code_2_rounded,
                    onPressed: () => context.go('/qr-pass'),
                  ),
                  const SizedBox(height: 10),
                  PrimaryButton(
                    label: 'Start Wound Pre-Triage Guide',
                    icon: Icons.camera_alt_outlined,
                    isOutlined: true,
                    onPressed: () => context.go('/triage'),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          const DisclaimerBanner(),
        ],
      ),
    );
  }
}
