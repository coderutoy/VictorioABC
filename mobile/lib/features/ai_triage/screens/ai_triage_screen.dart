import 'package:flutter/material.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';
import 'package:victorio_abc_mobile/shared/widgets/disclaimer_banner.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/primary_button.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class AiTriageScreen extends StatefulWidget {
  const AiTriageScreen({super.key});

  @override
  State<AiTriageScreen> createState() => _AiTriageScreenState();
}

class _AiTriageScreenState extends State<AiTriageScreen> {
  String _animalType = 'Dog';
  String _woundType = 'bite';
  bool _bleeding = true;
  bool _washedWithSoap = true;
  String? _advisoryCategory;

  void _computeAdvisoryCategory() {
    String cat = 'II';
    if (_animalType == 'Bat' || _bleeding || _woundType == 'lick_broken_skin') {
      cat = 'III';
    } else if (_woundType == 'intact_skin') {
      cat = 'I';
    }
    setState(() => _advisoryCategory = cat);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.navy,
        content: Text(
          'Pre-Triage Estimate: WHO Category $cat. Please proceed to Victorio ABC for physician verification.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const DisclaimerBanner(),
        const SizedBox(height: 14),
        InfoCard(
          title: 'Interactive Wound Pre-Triage',
          subtitle: 'Advisory WHO Rabies Exposure Category I–III Check',
          trailing: const StatusBadge(label: 'WHO Cat I–III', tone: BadgeTone.teal),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<String>(
                initialValue: _animalType,
                decoration: const InputDecoration(labelText: 'Biting Animal'),
                items: const [
                  DropdownMenuItem(value: 'Dog', child: Text('Dog')),
                  DropdownMenuItem(value: 'Cat', child: Text('Cat')),
                  DropdownMenuItem(value: 'Bat', child: Text('Bat')),
                  DropdownMenuItem(value: 'Other', child: Text('Other Mammal')),
                ],
                onChanged: (v) => setState(() => _animalType = v ?? 'Dog'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _woundType,
                decoration: const InputDecoration(labelText: 'Exposure Type'),
                items: const [
                  DropdownMenuItem(
                    value: 'bite',
                    child: Text('Bite / Puncture Wound'),
                  ),
                  DropdownMenuItem(
                    value: 'scratch',
                    child: Text('Scratch / Abrasion'),
                  ),
                  DropdownMenuItem(
                    value: 'lick_broken_skin',
                    child: Text('Lick on Broken Skin / Mucosa'),
                  ),
                  DropdownMenuItem(
                    value: 'intact_skin',
                    child: Text('Touch / Lick on Intact Skin'),
                  ),
                ],
                onChanged: (v) => setState(() => _woundType = v ?? 'bite'),
              ),
              const SizedBox(height: 8),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  'Active or Spontaneous Bleeding',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                value: _bleeding,
                activeThumbColor: AppColors.primary,
                onChanged: (v) => setState(() => _bleeding = v),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  'Washed with Soap & Water for 15 Mins',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
                value: _washedWithSoap,
                activeThumbColor: AppColors.primary,
                onChanged: (v) => setState(() => _washedWithSoap = v),
              ),
              const SizedBox(height: 12),
              PrimaryButton(
                label: 'Evaluate Advisory WHO Category',
                icon: Icons.fact_check_outlined,
                onPressed: _computeAdvisoryCategory,
              ),
              if (_advisoryCategory != null) ...[
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.mintLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.mint),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Advisory Estimate: WHO Category $_advisoryCategory',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppColors.navy,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _advisoryCategory == 'III'
                            ? 'Immediate Anti-Rabies Vaccine PEP + ERIG/HRIG wound infiltration is indicated. Visit the nearest Victorio ABC branch today.'
                            : _advisoryCategory == 'II'
                                ? 'Immediate Anti-Rabies Vaccine PEP schedule (Day 0, 3, 7, 14/28) is indicated.'
                                : 'Intact skin contact (Category I). Wash thoroughly with soap and water; consult a Victorio ABC physician to confirm.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
