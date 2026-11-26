import 'package:flutter/material.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';

class DisclaimerBanner extends StatelessWidget {
  final String message;

  const DisclaimerBanner({
    super.key,
    this.message =
        'Medical Disclaimer: AI wound pre-triage provides an advisory WHO Category estimate only and does not replace a licensed physician diagnosis. Visit your selected Victorio ABC clinic promptly for clinical validation and PEP administration.',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.warningBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.medical_information_outlined,
            color: AppColors.warning,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF92400E),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
