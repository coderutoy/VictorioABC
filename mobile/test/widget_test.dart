import 'package:flutter_test/flutter_test.dart';
import 'package:victorio_abc_mobile/main.dart';

void main() {
  testWidgets('Victorio ABC mobile app boots to branded splash screen',
      (WidgetTester tester) async {
    await tester.pumpWidget(const VictorioAbcPatientApp());
    expect(find.text('Victorio Animal Bite Center'), findsOneWidget);
    await tester.pump(const Duration(seconds: 1));
  });
}
