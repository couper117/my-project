// Lightweight in-app localization for the demo (en, rw, fr, sw).
// Production uses Flutter gen-l10n with ARB files (see PROJECT_STRUCTURE.md).
import 'package:flutter_riverpod/flutter_riverpod.dart';

final languageProvider = StateProvider<String>((_) => 'en');

const languages = {
  'en': 'English',
  'rw': 'Kinyarwanda',
  'fr': 'Français',
  'sw': 'Kiswahili',
};

const _strings = <String, Map<String, String>>{
  'en': {
    'home': 'Home',
    'usage': 'Usage',
    'buy': 'Buy',
    'alerts': 'Alerts',
    'more': 'More',
    'balance': 'Balance',
    'estimated': 'Estimated',
    'live': 'Live',
    'daysLeft': 'days left',
    'last7': 'Last 7 days',
    'buyElectricity': 'Buy Electricity',
    'payWith': 'Pay with',
    'tokenReady': 'Token ready',
    'settings': 'Settings',
    'theme': 'Theme',
    'language': 'Language',
    'tip': 'Switching off standby devices could save you ≈ 8% this month.',
  },
  'rw': {
    'home': 'Ahabanza',
    'usage': 'Ikoreshwa',
    'buy': 'Gura',
    'alerts': 'Imenyesha',
    'more': 'Ibindi',
    'balance': 'Amashanyarazi asigaye',
    'estimated': 'Igereranyo',
    'live': 'Ako kanya',
    'daysLeft': 'iminsi isigaye',
    'last7': 'Iminsi 7 ishize',
    'buyElectricity': 'Gura Amashanyarazi',
    'payWith': 'Ishyura ukoresheje',
    'tokenReady': 'Umubare wawe uraboneka',
    'settings': 'Igenamiterere',
    'theme': 'Isura',
    'language': 'Ururimi',
    'tip': 'Kuzimya ibikoresho bidakoreshwa byagufasha kuzigama ≈ 8% buri kwezi.',
  },
  'fr': {
    'home': 'Accueil',
    'usage': 'Consommation',
    'buy': 'Acheter',
    'alerts': 'Alertes',
    'more': 'Plus',
    'balance': 'Solde',
    'estimated': 'Estimé',
    'live': 'En direct',
    'daysLeft': 'jours restants',
    'last7': '7 derniers jours',
    'buyElectricity': "Acheter de l'électricité",
    'payWith': 'Payer avec',
    'tokenReady': 'Jeton prêt',
    'settings': 'Paramètres',
    'theme': 'Thème',
    'language': 'Langue',
    'tip': 'Éteindre les appareils en veille pourrait économiser ≈ 8% par mois.',
  },
  'sw': {
    'home': 'Nyumbani',
    'usage': 'Matumizi',
    'buy': 'Nunua',
    'alerts': 'Arifa',
    'more': 'Zaidi',
    'balance': 'Salio',
    'estimated': 'Kadirio',
    'live': 'Moja kwa moja',
    'daysLeft': 'siku zimebaki',
    'last7': 'Siku 7 zilizopita',
    'buyElectricity': 'Nunua Umeme',
    'payWith': 'Lipa kwa',
    'tokenReady': 'Tokeni tayari',
    'settings': 'Mipangilio',
    'theme': 'Mandhari',
    'language': 'Lugha',
    'tip': 'Kuzima vifaa visivyotumika kunaweza kukuokolea ≈ 8% kwa mwezi.',
  },
};

/// Translate [key] into the currently selected language.
String tr(WidgetRef ref, String key) {
  final lang = ref.watch(languageProvider);
  return _strings[lang]?[key] ?? _strings['en']![key] ?? key;
}
