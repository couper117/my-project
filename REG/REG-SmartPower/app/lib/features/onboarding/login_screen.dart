// Demo login: phone number -> OTP (any 6 digits accepted; real build
// verifies via SMS). Biometric/PIN steps are stubbed for the demo.
import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../shell/home_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController(text: '+250 788 123 456');

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(Tokens.s6),
          children: [
            const SizedBox(height: 40),
            Icon(Icons.bolt, size: 64, color: cs.primary),
            const SizedBox(height: 16),
            Text('Welcome to REG SmartPower',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('Sign in with your phone number, national ID or email.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 32),
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Phone number',
                prefixIcon: const Icon(Icons.phone),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(Tokens.radiusButton)),
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const OtpScreen())),
              child: const Text('Continue'),
            ),
            const SizedBox(height: 12),
            const Center(
                child: Text('Demo build — OTP is simulated',
                    style: TextStyle(fontSize: 12, color: Colors.grey))),
          ],
        ),
      ),
    );
  }
}

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  void _verify() {
    if (_code.text.trim().length == 6) {
      Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeShell()), (_) => false);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enter the 6-digit code (e.g. 123456)')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verification')),
      body: ListView(
        padding: const EdgeInsets.all(Tokens.s6),
        children: [
          const Text('We sent a 6-digit code to your phone.'),
          const SizedBox(height: 6),
          const Text('Demo: enter any 6 digits, e.g. 123456',
              style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 24),
          TextField(
            controller: _code,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, letterSpacing: 12),
            decoration: InputDecoration(
              counterText: '',
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Tokens.radiusButton)),
            ),
            onSubmitted: (_) => _verify(),
          ),
          const SizedBox(height: 24),
          FilledButton(onPressed: _verify, child: const Text('Verify')),
        ],
      ),
    );
  }
}
