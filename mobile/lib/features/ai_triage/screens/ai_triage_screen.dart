import 'package:flutter/material.dart';
import 'package:victorio_abc_mobile/shared/widgets/disclaimer_banner.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/primary_button.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class AiTriageScreen extends StatelessWidget {
  const AiTriageScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const DisclaimerBanner(),
        const SizedBox(height: 14),
        InfoCard(
          title: 'AI-Assisted Wound Pre-Triage',
          subtitle: 'Step 1: Photo Capture & Clinical Context Questionnaire',
          trailing: const StatusBadge(label: 'WHO Cat I–III', tone: BadgeTone.amber),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Upload a clear photo of the bite/scratch site and answer the clinical exposure questionnaire (animal species, stray vs. domestic status, vaccination history, and bite location) to route your case to your chosen Victorio ABC branch.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'Capture or Upload Wound Photo',
                icon: Icons.add_a_photo_outlined,
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('AI Pre-Triage camera & FastAPI inference will connect in Phase 4.'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
