import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Unified Victorio ABC Brand Palette
  // #464B71 (Deep Slate Navy) — headers, navigation bars, AppBars, primary typography
  static const Color navy = Color(0xFF464B71);
  static const Color navyDark = Color(0xFF343857);

  // #118AB2 (Clinical Blue) — primary buttons, active tabs, CTAs, links
  static const Color primary = Color(0xFF118AB2);
  static const Color primaryDark = Color(0xFF0D6E8E);
  static const Color primaryLight = Color(0xFFE6F5FA);
  static const Color primaryBorder = Color(0xFF7CD5C7);

  // #7CD5C7 (Mint Teal) — status badges, highlights, soft accents, verified tags
  static const Color mint = Color(0xFF7CD5C7);
  static const Color mintLight = Color(0xFFEAFBF8);
  static const Color mintDark = Color(0xFF1E6B60);

  // #F2F2ED (Warm Off-White) — page/scaffold background with crisp #FFFFFF elevated cards
  static const Color background = Color(0xFFF2F2ED);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFDDDCD4);
  static const Color textPrimary = Color(0xFF464B71);
  static const Color textSecondary = Color(0xFF52587A);
  static const Color textMuted = Color(0xFF6E7391);

  // Semantic Clinical Status Colors
  static const Color success = Color(0xFF059669);
  static const Color successBg = Color(0xFFECFDF5);
  static const Color warning = Color(0xFFD97706);
  static const Color warningBg = Color(0xFFFFFBEB);
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerBg = Color(0xFFFEF2F2);
  static const Color info = Color(0xFF118AB2);
  static const Color infoBg = Color(0xFFE6F5FA);
}
