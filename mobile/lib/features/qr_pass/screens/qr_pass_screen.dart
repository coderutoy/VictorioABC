import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class QrPassScreen extends StatelessWidget {
  const QrPassScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const sampleQrHash = 'VICTORIO-ABC-PATIENT-PASS-PREVIEW';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          title: 'Global Clinic Check-In Pass',
          subtitle: 'Valid at all Victorio ABC outpatient branches',
          trailing: const StatusBadge(label: 'Cross-Branch', tone: BadgeTone.emerald),
          child: Column(
            children: [
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: QrImageView(
                  data: sampleQrHash,
                  version: QrVersions.auto,
                  size: 210,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: AppColors.primaryDark,
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Present this QR code to the clinic nurse upon arrival to load your case history and log your PEP dose.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
