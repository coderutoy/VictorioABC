import 'package:flutter/material.dart';
import 'package:victorio_abc_mobile/shared/widgets/info_card.dart';
import 'package:victorio_abc_mobile/shared/widgets/status_badge.dart';

class EducationScreen extends StatelessWidget {
  const EducationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final articles = [
      (
        'Immediate First Aid After an Animal Bite',
        'First Aid',
        BadgeTone.teal,
        'Wash the bite or scratch immediately with running water and soap for at least 15 minutes, apply povidone-iodine, and visit a Victorio ABC branch.',
      ),
      (
        'Why Tandok & Garlic Do Not Prevent Rabies',
        'Myth Busting',
        BadgeTone.red,
        'Traditional suction horns (tandok), garlic, or vinegar cannot neutralize rabies virus and cause dangerous treatment delays.',
      ),
      (
        '14-Day Biting Animal Observation Guide',
        'Observation',
        BadgeTone.amber,
        'Confine and observe known domestic dogs or cats for 14 days without harming them. Report behavioral changes or animal death immediately.',
      ),
    ];

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: articles.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = articles[index];
        return InfoCard(
          title: item.$1,
          trailing: StatusBadge(label: item.$2, tone: item.$3),
          child: Text(
            item.$4,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        );
      },
    );
  }
}
