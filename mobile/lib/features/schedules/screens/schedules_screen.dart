import 'package:flutter/material.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class SchedulesScreen extends StatelessWidget {
  const SchedulesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final regimenDays = [
      ('Day 0', 'Initial dose + ERIG/Tetanus if prescribed'),
      ('Day 3', 'Second PEP dose (cross-branch eligible)'),
      ('Day 7', 'Third PEP dose'),
      ('Day 14', 'Fourth dose (IM Essen regimen only)'),
      ('Day 28', 'Final booster / completion dose'),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          title: 'PEP Vaccination Timeline',
          subtitle: 'Standard WHO Post-Exposure Prophylaxis Schedule',
          trailing: const StatusBadge(label: 'Day 0–28', tone: BadgeTone.blue),
          child: Column(
            children: regimenDays
                .map(
                  (item) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      radius: 18,
                      backgroundColor: const Color(0xFFF0FDFA),
                      child: Text(
                        item.$1.replaceAll('Day ', 'D'),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F766E),
                        ),
                      ),
                    ),
                    title: Text(item.$1, style: Theme.of(context).textTheme.titleSmall),
                    subtitle: Text(item.$2, style: Theme.of(context).textTheme.bodySmall),
                    trailing: const StatusBadge(label: 'Pending', tone: BadgeTone.slate),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }
}
