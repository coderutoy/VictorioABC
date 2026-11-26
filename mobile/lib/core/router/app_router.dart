import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:victorio_abc_mobile/core/config/supabase_config.dart';
import 'package:victorio_abc_mobile/features/ai_triage/screens/ai_triage_screen.dart';
import 'package:victorio_abc_mobile/features/auth/screens/login_screen.dart';
import 'package:victorio_abc_mobile/features/auth/screens/register_screen.dart';
import 'package:victorio_abc_mobile/features/education/screens/education_screen.dart';
import 'package:victorio_abc_mobile/features/home/screens/home_screen.dart';
import 'package:victorio_abc_mobile/features/qr_pass/screens/qr_pass_screen.dart';
import 'package:victorio_abc_mobile/features/schedules/screens/schedules_screen.dart';
import 'package:victorio_abc_mobile/shared/widgets/app_footer_nav.dart';
import 'package:victorio_abc_mobile/shared/widgets/app_header.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: SupabaseConfig.isConfigured ? '/login' : '/home',
    redirect: (context, state) {
      if (!SupabaseConfig.isConfigured) return null;

      final session = Supabase.instance.client.auth.currentSession;
      final isAuthRoute =
          state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (session == null && !isAuthRoute) {
        return '/login';
      }
      if (session != null && isAuthRoute) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return Scaffold(
            appBar: const AppHeader(),
            body: navigationShell,
            bottomNavigationBar: AppFooterNav(
              currentIndex: navigationShell.currentIndex,
              onDestinationSelected: (index) {
                navigationShell.goBranch(
                  index,
                  initialLocation: index == navigationShell.currentIndex,
                );
              },
            ),
          );
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/triage',
                builder: (context, state) => const AiTriageScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/qr-pass',
                builder: (context, state) => const QrPassScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/schedules',
                builder: (context, state) => const SchedulesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/education',
                builder: (context, state) => const EducationScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
