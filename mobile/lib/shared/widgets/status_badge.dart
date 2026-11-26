import 'package:flutter/material.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';

enum BadgeTone { teal, emerald, amber, red, blue, slate }

class StatusBadge extends StatelessWidget {
  final String label;
  final BadgeTone tone;

  const StatusBadge({
    super.key,
    required this.label,
    this.tone = BadgeTone.slate,
  });

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      BadgeTone.teal => (AppColors.mint.withValues(alpha: 0.35), AppColors.navy),
      BadgeTone.emerald => (AppColors.successBg, AppColors.success),
      BadgeTone.amber => (AppColors.warningBg, AppColors.warning),
      BadgeTone.red => (AppColors.dangerBg, AppColors.danger),
      BadgeTone.blue => (AppColors.primaryLight, AppColors.primaryDark),
      BadgeTone.slate => (const Color(0xFFE6E6DF), AppColors.textSecondary),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}
