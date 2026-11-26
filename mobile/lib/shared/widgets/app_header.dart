import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:victorio_abc_mobile/core/config/supabase_config.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onNotificationsTap;
  final bool hasUnreadNotifications;

  const AppHeader({
    super.key,
    this.title = 'Victorio ABC',
    this.subtitle,
    this.onNotificationsTap,
    this.hasUnreadNotifications = true,
  });

  @override
  Size get preferredSize => const Size.fromHeight(64);

  Future<void> _handleSignOut(BuildContext context) async {
    if (SupabaseConfig.isConfigured) {
      await Supabase.instance.client.auth.signOut();
      await SupabaseConfig.refreshUserProfile();
    }
    if (context.mounted) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final roleLabel = SupabaseConfig.currentRole.toUpperCase();
    final resolvedSubtitle = subtitle ??
        (SupabaseConfig.isStaffRole
            ? 'Clinical Staff Mobile Workspace'
            : 'Patient Digital QR Pass & PEP Portal');

    return AppBar(
      toolbarHeight: 64,
      titleSpacing: 14,
      backgroundColor: AppColors.navy,
      foregroundColor: Colors.white,
      title: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            padding: const EdgeInsets.all(1.5),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: AppColors.mint, width: 1.5),
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/victorio_logo.jpg',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Center(
                  child: Text(
                    'VA',
                    style: TextStyle(
                      color: AppColors.navy,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.mint,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        roleLabel,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: AppColors.navy,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  resolvedSubtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w400,
                    color: Color(0xFFD8DBE8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          onPressed: onNotificationsTap ??
              () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('PEP schedule reminders are synced with your account.'),
                    duration: Duration(seconds: 2),
                  ),
                );
              },
          icon: const Icon(Icons.notifications_outlined, color: Colors.white),
          tooltip: 'Notifications',
        ),
        IconButton(
          onPressed: () => _handleSignOut(context),
          icon: const Icon(Icons.logout_rounded, color: Colors.white),
          tooltip: 'Sign Out',
        ),
      ],
    );
  }
}
