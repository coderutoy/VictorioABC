import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';
import 'package:victorio_abc_mobile/shared/widgets/disclaimer_banner.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/primary_button.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Welcome to Victorio ABC',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 4),
        Text(
          'Your multi-branch rabies post-exposure prophylaxis (PEP) companion.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        InfoCard(
          title: 'Next PEP Vaccination',
          subtitle: 'Active Treatment Tracker',
          trailing: const StatusBadge(label: 'Ready', tone: BadgeTone.teal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'No active PEP schedule linked yet. Start an AI Wound Pre-Triage or present your QR Pass at any Victorio ABC branch.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.45),
              ),
              const SizedBox(height: 14),
              PrimaryButton(
                label: 'Start AI Wound Pre-Triage',
                icon: Icons.camera_alt_outlined,
                onPressed: () => context.go('/triage'),
              ),
              const SizedBox(height: 10),
              PrimaryButton(
                label: 'Open Clinic QR Pass',
                icon: Icons.qr_code_2_rounded,
                isOutlined: true,
                onPressed: () => context.go('/qr-pass'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        const DisclaimerBanner(),
      ],
    );
  }
}
