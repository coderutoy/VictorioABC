import 'package:intl/intl.dart';

class DateFormatters {
  DateFormatters._();

  static String formatShortDate(DateTime date) =>
      DateFormat('MMM d, yyyy').format(date);

  static String formatDateTime(DateTime date) =>
      DateFormat('MMM d, yyyy • h:mm a').format(date);

  static String relativeDueLabel(DateTime scheduledDate) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(scheduledDate.year, scheduledDate.month, scheduledDate.day);
    final diff = target.difference(today).inDays;

    if (diff == 0) return 'Due Today';
    if (diff == 1) return 'Due Tomorrow';
    if (diff > 1) return 'In $diff days';
    return '${diff.abs()} day(s) overdue';
  }
}
