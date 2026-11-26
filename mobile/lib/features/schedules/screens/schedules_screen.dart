import 'package:flutter/material.dart';
import 'package:victorio_abc_mobile/core/config/supabase_config.dart';
import 'package:victorio_abc_mobile/core/theme/app_colors.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class SchedulesScreen extends StatefulWidget {
  const SchedulesScreen({super.key});

  @override
  State<SchedulesScreen> createState() => _SchedulesScreenState();
}

class _SchedulesScreenState extends State<SchedulesScreen> {
  bool _loading = true;
  List<dynamic> _liveSchedules = const [];

  static const _defaultRegimenDays = [
    ('Day 0', 'Initial dose + ERIG/Tetanus if prescribed', 'scheduled'),
    ('Day 3', 'Second PEP dose (cross-branch eligible)', 'scheduled'),
    ('Day 7', 'Third PEP dose', 'scheduled'),
    ('Day 14', 'Fourth dose (IM Essen regimen only)', 'scheduled'),
    ('Day 28', 'Final booster / completion dose', 'scheduled'),
  ];

  @override
  void initState() {
    super.initState();
    _fetchSchedules();
  }

  Future<void> _fetchSchedules() async {
    setState(() => _loading = true);
    if (!SupabaseConfig.isConfigured) {
      setState(() => _loading = false);
      return;
    }
    try {
      final res = await SupabaseConfig.getApi('/schedules');
      setState(() {
        _liveSchedules = (res['data'] as List<dynamic>?) ?? const [];
      });
    } catch (_) {
      // Fallback to standard WHO guide if offline
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  BadgeTone _toneForStatus(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return BadgeTone.emerald;
      case 'rescheduled':
        return BadgeTone.blue;
      case 'defaulted':
        return BadgeTone.red;
      default:
        return BadgeTone.amber;
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: _fetchSchedules,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          InfoCard(
            title: 'PEP Vaccination Timeline',
            subtitle: _liveSchedules.isNotEmpty
                ? 'Synced with Victorio ABC Clinical Orders'
                : 'Standard WHO Post-Exposure Prophylaxis Schedule',
            trailing: const StatusBadge(label: 'Day 0–28', tone: BadgeTone.teal),
            child: _loading
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 28),
                    child: Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    ),
                  )
                : _liveSchedules.isNotEmpty
                    ? Column(
                        children: _liveSchedules.map((raw) {
                          final item = raw as Map<String, dynamic>;
                          final dose = item['dose_number']?.toString() ?? 'Dose';
                          final date = item['scheduled_date']?.toString() ?? '';
                          final status = item['status']?.toString() ?? 'scheduled';
                          final patientName = ((item['bite_case']
                                      as Map<String, dynamic>?)?['patient']
                                  as Map<String, dynamic>?)?['full_name']
                              ?.toString();

                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              radius: 18,
                              backgroundColor: AppColors.mint.withValues(alpha: 0.35),
                              child: Text(
                                dose.replaceAll('Day ', 'D'),
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.navy,
                                ),
                              ),
                            ),
                            title: Text(
                              patientName != null ? '$dose • $patientName' : dose,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleSmall,
                            ),
                            subtitle: Text(
                              'Scheduled Date: $date',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            trailing: StatusBadge(
                              label: status.toUpperCase(),
                              tone: _toneForStatus(status),
                            ),
                          );
                        }).toList(),
                      )
                    : Column(
                        children: _defaultRegimenDays
                            .map(
                              (item) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: CircleAvatar(
                                  radius: 18,
                                  backgroundColor:
                                      AppColors.mint.withValues(alpha: 0.35),
                                  child: Text(
                                    item.$1.replaceAll('Day ', 'D'),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.navy,
                                    ),
                                  ),
                                ),
                                title: Text(
                                  item.$1,
                                  style: Theme.of(context).textTheme.titleSmall,
                                ),
                                subtitle: Text(
                                  item.$2,
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                trailing: const StatusBadge(
                                  label: 'Guide',
                                  tone: BadgeTone.slate,
                                ),
                              ),
                            )
                            .toList(),
                      ),
          ),
        ],
      ),
    );
  }
}
