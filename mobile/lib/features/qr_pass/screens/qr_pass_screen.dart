import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:victorio_abc_mobile/core/config/supabase_config.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/primary_button.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class QrPassScreen extends StatefulWidget {
  const QrPassScreen({super.key});

  @override
  State<QrPassScreen> createState() => _QrPassScreenState();
}

class _QrPassScreenState extends State<QrPassScreen> {
  bool _loading = true;
  String _qrToken = 'VABC-PATIENT-PASS';
  String _fullName = 'Victorio ABC Patient';
  String _barangay = 'San Jose del Monte';

  @override
  void initState() {
    super.initState();
    _loadQrProfile();
  }

  Future<void> _loadQrProfile() async {
    setState(() => _loading = true);
    if (!SupabaseConfig.isConfigured) {
      setState(() => _loading = false);
      return;
    }
    try {
      final res = await SupabaseConfig.getApi('/patients');
      final list = (res['data'] as List<dynamic>?) ?? const [];
      if (list.isNotEmpty) {
        final first = list.first as Map<String, dynamic>;
        setState(() {
          _qrToken = first['qr_code_hash']?.toString() ?? _qrToken;
          _fullName = first['full_name']?.toString() ?? _fullName;
          _barangay = 'Brgy. ${first['barangay'] ?? 'SJDM'}';
        });
      }
    } catch (_) {
      // Keep fallback preview QR token
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _copyToken() async {
    await Clipboard.setData(ClipboardData(text: _qrToken));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.navy,
          content: Text('Copied QR token $_qrToken to clipboard.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _loadQrProfile,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          InfoCard(
            title: 'Global Clinic Check-In Pass',
            subtitle: 'Valid at all Victorio ABC branches in San Jose del Monte',
            trailing: const StatusBadge(label: 'Cross-Branch', tone: BadgeTone.teal),
            child: _loading
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      final qrSize =
                          (constraints.maxWidth - 48).clamp(150.0, 210.0);
                      return Column(
                        children: [
                          Text(
                            _fullName,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _barangay,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: AppColors.mint,
                                width: 2,
                              ),
                            ),
                            child: QrImageView(
                              data: _qrToken,
                              version: QrVersions.auto,
                              size: qrSize,
                              eyeStyle: const QrEyeStyle(
                                eyeShape: QrEyeShape.square,
                                color: AppColors.navy,
                              ),
                              dataModuleStyle: const QrDataModuleStyle(
                                dataModuleShape: QrDataModuleShape.square,
                                color: AppColors.navy,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.background,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: SelectableText(
                              _qrToken,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: AppColors.navy,
                                letterSpacing: 1.1,
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                          PrimaryButton(
                            label: 'Copy QR Pass Token',
                            icon: Icons.copy_rounded,
                            isOutlined: true,
                            onPressed: _copyToken,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Present this QR code to the reception or triage nurse upon arrival to load your encrypted medical record and log your PEP dose.',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
