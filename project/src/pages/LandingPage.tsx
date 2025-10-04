import React from 'react';
import { Heart, Activity, ShieldCheck, Timer, Cpu, Fingerprint, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-red-100">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-lg font-semibold text-gray-900">MatchingSystem</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
            <a href="#security" className="text-gray-600 hover:text-gray-900">Security</a>
          </nav>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-100 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium mb-4">
              <Timer className="h-3.5 w-3.5" />
              <span>Real-time viability aware</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              Smarter organ matching for faster, safer transplants
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              An end‑to‑end allocation assistant combining HLA compatibility, risk analytics, and cold ischemia window tracking to prioritize the right recipients at the right time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium"
              >
                Start Matching
              </button>
              <a href="#features" className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-center">
                See Features
              </a>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">Real-time</p>
                <p className="text-xs text-gray-500">Viability countdown</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">HLA</p>
                <p className="text-xs text-gray-500">Antigen-level scoring</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Risk</p>
                <p className="text-xs text-gray-500">Transparent factors</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-gray-900">Live Match Preview</span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">Demo</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500">Donor</p>
                  <p className="font-medium text-gray-900 mt-1">O+, 45y</p>
                  <p className="text-sm text-gray-600">Heart, 5.2h remaining</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500">Recipient</p>
                  <p className="font-medium text-gray-900 mt-1">O+, 42y</p>
                  <p className="text-sm text-gray-600">UNOS 1A, Critical</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center rounded-lg bg-green-50 p-3">
                  <p className="text-lg font-bold text-green-700">92%</p>
                  <p className="text-[11px] text-green-700">Match</p>
                </div>
                <div className="text-center rounded-lg bg-blue-50 p-3">
                  <p className="text-lg font-bold text-blue-700">88%</p>
                  <p className="text-[11px] text-blue-700">HLA</p>
                </div>
                <div className="text-center rounded-lg bg-yellow-50 p-3">
                  <p className="text-lg font-bold text-yellow-700">Low</p>
                  <p className="text-[11px] text-yellow-700">Risk</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="mt-6 w-full px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black"
              >
                Try the App
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">Everything you need to allocate confidently</h2>
          <p className="mt-2 text-gray-600 text-center">Built-in safeguards and transparent scoring help your team decide fast.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature icon={<Activity className="h-5 w-5" />} title="Compatibility Engine" desc="Blood type, antigen-level HLA matching, size, and urgency with clear factor breakdown." />
            <Feature icon={<Timer className="h-5 w-5" />} title="Viability Countdown" desc="Real-time cold ischemia tracking with expiry enforcement and near-expiry alerts." />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Risk Insights" desc="Simple, explainable risk model with age, HLA mismatch, size, and comorbidities." />
            <Feature icon={<Cpu className="h-5 w-5" />} title="Smart Prioritization" desc="Organ-specific weights and thresholds to reflect practical matching policies." />
            <Feature icon={<Fingerprint className="h-5 w-5" />} title="HLA Normalization" desc="Antigen-level normalization and unacceptable antigen checks for early rejection." />
            <Feature icon={<Heart className="h-5 w-5" />} title="Clinically-Inspired" desc="Kidney/Heart/Liver rules of thumb baked in with configurable ranges." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">How it works</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            <Step num="1" title="Add Donors & Recipients" desc="Enter demographics, HLA typing, and clinical context in minutes." />
            <Step num="2" title="Review Matches" desc="See ranked results with scores, risk, and real-time viability windows." />
            <Step num="3" title="Allocate Confidently" desc="Schedule, document notes, and track timelines end-to-end." />
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Security and privacy first</h2>
            <p className="mt-3 text-gray-600">Role-based access, audit-friendly logs, and transparent calculations ensure safe collaboration.</p>
            <ul className="mt-5 space-y-2 text-gray-700 text-sm">
              <li className="flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Clear, explainable scoring with no black boxes</span>
              </li>
              <li className="flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                <span>No PHI required for demo usage</span>
              </li>
              <li className="flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Client-side display with minimal data exposure</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black"
            >
              Continue to Login
            </button>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <Metric label="Organs Supported" value="3" />
              <Metric label="HLA Loci" value="6" />
              <Metric label="Real-time Checks" value="Yes" />
              <Metric label="Explainability" value="High" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-500">
          <p>© {new Date().getFullYear()} MatchingSystem. All rights reserved.</p>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <a href="#features" className="hover:text-gray-700">Features</a>
            <a href="#how-it-works" className="hover:text-gray-700">How it works</a>
            <a href="#security" className="hover:text-gray-700">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 bg-white">
      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
        {num}
      </div>
      <h4 className="mt-3 font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-4">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
