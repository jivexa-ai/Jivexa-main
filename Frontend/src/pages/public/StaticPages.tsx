import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Shield, BookOpen, Clock, Heart, Users, HelpCircle, Check, HelpCircle as HelpIcon, Mail, Phone, MapPin, Sparkles, Database } from 'lucide-react';

// --- ABOUT PAGE ---
export const About: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', backgroundColor: 'var(--background)', overflowX: 'hidden' }}>
      
      {/* 1. Header Banner */}
      <section style={{ padding: '80px 0', background: 'radial-gradient(circle at 80% 20%, var(--primary-light) 0%, #ffffff 60%)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Our Mission</span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: '1.15' }}>
            Reimagining Healthcare with <br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Intelligence, Connection, and Care</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '8px', lineHeight: '1.6' }}>
            Healthcare should not feel fragmented, confusing, or difficult to navigate. Jivexa is designed around people to simplify the health journey.
          </p>
        </div>
      </section>

      {/* 2. Brand Story Narrative */}
      <section style={{ padding: '90px 0', backgroundColor: '#ffffff' }}>
        <div className="container grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '60px', alignItems: 'center', maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>Making Healthcare Human</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '1.05rem' }}>
              <strong>Jivexa Health</strong> is building a next-generation HealthTech ecosystem from India, powered by artificial intelligence and designed around people. Our vision is to bring patients, doctors, pharmacies, and intelligent healthcare tools together through one connected digital ecosystem.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '1.05rem' }}>
              We believe technology should make healthcare easier to understand—not more complicated. Through AI-powered assistance, intelligent health insights, connected healthcare pathways, and accessible digital tools, Jivexa Health aims to help people better understand their health while enabling healthcare professionals to work with greater clarity and efficiency.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '1.05rem' }}>
              Our long-term vision is to build a trusted healthcare infrastructure where information flows more intelligently, healthcare journeys become more connected, and technology helps reduce the friction between people and the care they need.
            </p>
            <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '16px', marginTop: '10px' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                "We are not building technology to replace human healthcare. We are building technology to make healthcare more connected, understandable, and human."
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, var(--secondary-glow) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 1, top: '-20px', left: '-20px' }} />
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: 'var(--shadow-sm)', zIndex: 2 }}>
                <Heart size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <div style={{ zIndex: 2 }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Designed in India</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.6' }}>
                  Engineered to support medical standards, electronic health files, and seamless digital doctor prescription check logs.
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', backgroundColor: 'white', color: 'var(--primary)', borderRadius: '4px', textTransform: 'uppercase', width: 'max-content', margin: '0 auto', border: '1px solid var(--border)', zIndex: 2 }}>
                Platform Integrity
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Principles Section */}
      <section style={{ padding: '90px 0', backgroundColor: '#f9fbfb', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', flexDirection: 'column', gap: '50px' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Core Values</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>Our Core Principles</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '12px' }}>
              These design tenets guide our engineering priorities and coordinate user support.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }} className="grid-3-mobile">
            <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>01 — PRINCIPLE</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Radical Clarity</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                We transform complex healthcare information into clear, accessible insights that people can understand and act upon.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>02 — PRINCIPLE</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Intelligent Healthcare</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                We use AI to simplify health journeys, deliver meaningful insights, and support better-informed decisions.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>03 — PRINCIPLE</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Connected Ecosystem</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                We connect patients, doctors, pharmacies, and healthcare services through a unified digital ecosystem.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>04 — PRINCIPLE</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Privacy by Design</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                We believe trust is fundamental to healthcare. Privacy, security, and responsible technology remain at the core of everything we build.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)', gridColumn: 'span 2' }} className="grid-span-mobile-1">
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>05 — PRINCIPLE</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Human-Centered Innovation</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                Technology should empower people and support healthcare professionals—not replace human care, compassion, or medical judgment.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Our Vision Panel Banner */}
      <section style={{ padding: '100px 0', background: 'radial-gradient(circle at center, var(--primary-light) 0%, #ffffff 100%)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '720px', margin: '0 auto', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Strategic Vision</span>
          <h2 style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1.1, color: 'var(--text-main)' }}>
            To build India's next-generation AI-powered HealthTech ecosystem and make intelligent, connected healthcare accessible to everyone.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: '1.6' }}>
            <strong>JIVEXA</strong> — Building the Future of Intelligent Healthcare.
          </p>
        </div>
      </section>

    </div>
  );
};

// --- HOW IT WORKS ---
export const HowItWorks: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', backgroundColor: 'var(--background)', overflowX: 'hidden' }}>
      
      {/* 1. Header Banner */}
      <section style={{ padding: '80px 0', background: 'radial-gradient(circle at 80% 20%, var(--primary-light) 0%, #ffffff 60%)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>How JIVEXA Works</span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: '1.15' }}>
            One Intelligent Ecosystem. <br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Every Step of Your Healthcare Journey</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.65' }}>
            From understanding your health to connecting with the right care, JIVEXA brings patients, healthcare professionals, and pharmacies together through one seamless, intelligent healthcare ecosystem.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', padding: '8px 20px', border: '1.5px solid var(--primary)', borderRadius: 'var(--radius-sm)', letterSpacing: '0.02em' }}>
              Understand. Connect. Care. — All in One Place.
            </span>
          </div>
        </div>
      </section>

      {/* 2. Step 1: Health Profile */}
      <section style={{ padding: '90px 0', backgroundColor: '#ffffff' }}>
        <div className="container grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '60px', alignItems: 'center', maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>01 — Build Your Health Profile</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.2' }}>Your Health. Your Story. Your Secure Health Vault.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.7' }}>
              Start by creating your personal JIVEXA profile and bring your essential health information together in one place. Securely organize important details such as:
            </p>
            <ul style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <Check size={16} style={{ color: 'var(--primary)' }} /> Allergies & history
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <Check size={16} style={{ color: 'var(--primary)' }} /> Health conditions
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <Check size={16} style={{ color: 'var(--primary)' }} /> Current medications
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <Check size={16} style={{ color: 'var(--primary)' }} /> Previous prescriptions
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', gridColumn: 'span 2' }}>
                <Check size={16} style={{ color: 'var(--primary)' }} /> Lab reports & health documents
              </li>
            </ul>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.7' }}>
              Your <strong>Health Vault</strong> gives you a clear, organized view of your health information—so you can access and share relevant records when you need them.
            </p>
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', marginTop: '8px' }}>
              Create Your Health Profile &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-md)',
              position: 'relative'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>Central Vault status</span>
              <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Intake Files</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700 }}>4 Encrypted Uploads</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--primary)' }} />
                </div>
              </div>
              <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Shield size={18} style={{ color: 'var(--secondary)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Allergen Check Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Step 2: Connect With Care */}
      <section style={{ padding: '90px 0', backgroundColor: '#f9fbfb', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '60px', alignItems: 'center', maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: 'white',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Find Care</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cardiology Specialist</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--secondary)' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Availability: Today</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>02 — Connect With the Right Care</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.2' }}>From Your Health Data to Better Conversations.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.7' }}>
              Find and connect with healthcare professionals based on your needs. Explore doctors by specialty, location, availability, and consultation preferences.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.7' }}>
              Book an appointment and securely share the health information that matters. During consultations, healthcare professionals can review the information you choose to share, helping create a more informed and connected care experience.
            </p>
            <Link to="/signup" style={{ color: 'var(--secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', marginTop: '8px' }}>
              Find Your Care &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Step 3: Continue Care Journey */}
      <section style={{ padding: '90px 0', backgroundColor: '#ffffff' }}>
        <div className="container grid-2-mobile" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '60px', alignItems: 'center', maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>03 — Continue Your Care Journey</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.2' }}>From Prescription to Fulfillment—Without the Friction.</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.7' }}>
              After your consultation, your digital prescription can become part of your connected healthcare journey. Access your prescription from your JIVEXA dashboard and, where available, share it with participating pharmacy partners.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.02rem', lineHeight: '1.7' }}>
              Pharmacies can help confirm medicine availability and provide updates on your order status, creating a smoother connection between:
            </p>
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: 'max-content', fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
              Doctor &rarr; Prescription &rarr; Pharmacy &rarr; Patient
            </div>
            <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', marginTop: '8px' }}>
              Manage Your Medicines &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>Fulfillment Loop</span>
              <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 700 }}>Status</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>Dispensed & Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Healthcare Loop */}
      <section style={{ padding: '100px 0', background: 'radial-gradient(circle at center, var(--primary-light) 0%, #ffffff 100%)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px', maxWidth: '750px', margin: '0 auto', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>The JIVEXA Healthcare Loop</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, color: 'var(--text-main)' }}>
            One Journey. One Connected Ecosystem.
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem', margin: '10px 0' }}>
            <span>You</span> &rarr; <span>Your Health</span> &rarr; <span>Your Doctor</span> &rarr; <span>Your Prescription</span> &rarr; <span>Your Pharmacy</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: '1.65' }}>
            JIVEXA brings the different pieces of healthcare closer together—helping make the journey more connected, understandable, and easier to manage. Powered by AI. Built Around People.
          </p>
          <Link 
            to="/signup"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '1.05rem',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              textDecoration: 'none'
            }}
          >
            Explore the JIVEXA Ecosystem &rarr;
          </Link>
        </div>
      </section>

    </div>
  );
};

// --- FOR DOCTORS ---
export const ForDoctors: React.FC = () => {
  const benefits = [
    {
      title: 'Reach More Patients',
      body: 'Build your professional presence and become discoverable to patients looking for healthcare professionals based on specialty, location, and availability.'
    },
    {
      title: 'Build Your Digital Practice',
      body: 'Create your professional profile, showcase your expertise, and manage your healthcare practice through a modern digital platform.'
    },
    {
      title: 'Smarter Patient Management',
      body: 'Access relevant patient information shared with consent, helping you understand the patient\'s health context before and during consultations.'
    },
    {
      title: 'Simplify Your Workflow',
      body: 'Manage appointments, consultation schedules, patient records, and digital prescriptions from one connected workspace.'
    },
    {
      title: 'Stay Connected With Patients',
      body: 'Keep the healthcare journey connected beyond the consultation with digital prescriptions, health information, and patient follow-ups.'
    },
    {
      title: 'Grow With the JIVEXA Ecosystem',
      body: 'Become part of a connected network bringing together patients, doctors, pharmacies, and AI-powered healthcare tools.'
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', backgroundColor: 'var(--background)', overflowX: 'hidden' }}>

      {/* 1. Header Banner */}
      <section style={{ padding: '80px 0', background: 'radial-gradient(circle at 80% 20%, var(--primary-light) 0%, #ffffff 60%)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>For Healthcare Professionals</span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: '1.15' }}>
            Grow Your Practice. Simplify Your Workflow. <br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Deliver Better Care</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.65' }}>
            JIVEXA is building a connected healthcare ecosystem where doctors can focus on what matters most — their patients.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.65' }}>
            Join a growing digital healthcare network designed to help practitioners build a stronger presence, manage their practice more efficiently, and connect with patients through intelligent technology.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <Link
              to="/signup?role=DOCTOR"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                textDecoration: 'none',
              }}
            >
              Create Your Professional Profile →
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Why Join JIVEXA */}
      <section style={{ padding: '90px 0', backgroundColor: '#f9fbfb', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', flexDirection: 'column', gap: '50px' }}>

          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Built For You</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>Why Join JIVEXA?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '12px' }}>
              Everything a modern healthcare professional needs to grow, manage, and deliver connected care.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }} className="grid-3-mobile">
            {benefits.map((b, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{b.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.65' }}>{b.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. Vision CTA Banner */}
      <section style={{ padding: '100px 0', background: 'radial-gradient(circle at center, var(--primary-light) 0%, #ffffff 100%)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '720px', margin: '0 auto', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>The JIVEXA Promise</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.15, color: 'var(--text-main)' }}>
            Your Expertise. Our Technology.<br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Better Connected Care</span>.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: '1.65' }}>
            Join JIVEXA and be part of the next generation of connected healthcare.
          </p>
          <Link
            to="/signup?role=DOCTOR"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '1.05rem',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              textDecoration: 'none',
            }}
          >
            Create Your Professional Profile →
          </Link>
        </div>
      </section>

    </div>
  );
};


// --- FOR PHARMACIES ---
export const ForPharmacies: React.FC = () => {
  const whyJoin = [
    {
      title: 'Receive Clear Digital Prescriptions',
      body: 'Move beyond difficult-to-read handwritten prescriptions. Receive structured digital prescriptions with clear medication details, quantities, dosage instructions, and duration—helping reduce avoidable errors.',
    },
    {
      title: 'Reach More Customers',
      body: 'Become part of a connected healthcare network where patients can discover participating pharmacies and connect their prescriptions with the right fulfillment partner.',
    },
    {
      title: 'Simplify Order Management',
      body: 'Manage incoming prescription requests, confirm availability, prepare orders, and update fulfillment status from one organized pharmacy dashboard.',
    },
    {
      title: 'Manage Inventory Smarter',
      body: 'Track medicine availability and maintain updated stock information to help your team respond to orders more efficiently.',
    },
    {
      title: 'Stay Connected With Patients',
      body: 'Keep customers informed with clear order status updates—from confirmation and preparation to dispatch or fulfillment.',
    },
  ];

  const smartFeatures = [
    {
      title: 'Digital Prescription Verification',
      body: 'Review and verify structured prescriptions before processing orders.',
    },
    {
      title: 'Availability & Substitution Communication',
      body: 'Communicate with patients or healthcare professionals when an alternative medicine or clarification may be required, subject to appropriate professional and regulatory requirements.',
    },
    {
      title: 'Transparent Order Information',
      body: 'Maintain clear pricing and order details for a better customer experience.',
    },
    {
      title: 'Real-Time Order Status',
      body: 'Move orders through a simple, clear workflow from start to fulfillment.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', backgroundColor: 'var(--background)', overflowX: 'hidden' }}>

      {/* 1. Header Banner */}
      <section style={{ padding: '80px 0', background: 'radial-gradient(circle at 80% 20%, var(--primary-light) 0%, #ffffff 60%)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>For Pharmacy Partners</span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: '1.15' }}>
            Turn Every Prescription Into a <br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Smoother Fulfillment Journey</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.65' }}>
            JIVEXA connects pharmacies with a growing digital healthcare ecosystem, helping them receive structured prescriptions, manage orders efficiently, and stay connected with patients throughout the fulfillment journey.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
            <Link
              to="/signup?role=PHARMACY"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                textDecoration: 'none',
              }}
            >
              Become a JIVEXA Pharmacy Partner →
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Why Pharmacies Join */}
      <section style={{ padding: '90px 0', backgroundColor: '#f9fbfb', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', flexDirection: 'column', gap: '50px' }}>

          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Built For You</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>Why Pharmacies Join JIVEXA</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '12px' }}>
              A smarter, connected way to manage your pharmacy and serve your patients better.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }} className="grid-3-mobile">
            {whyJoin.map((item, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  ...(i === 4 ? { gridColumn: 'span 2' } : {}),
                }}
                className={i === 4 ? 'grid-span-mobile-1' : ''}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{item.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.65' }}>{item.body}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. Smart Pharmacy Management */}
      <section style={{ padding: '90px 0', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: 'var(--max-content-width)', margin: '0 auto', padding: '0 var(--space-md)', display: 'flex', flexDirection: 'column', gap: '50px' }}>

          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform Features</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>Smart Pharmacy Management</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginTop: '12px' }}>
              Tools designed to make your pharmacy workflow more structured, efficient, and connected.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '28px' }} className="grid-2-mobile">
            {smartFeatures.map((feat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--primary-light)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{feat.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.65' }}>{feat.body}</p>
                {feat.title === 'Real-Time Order Status' && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {['Confirmed', 'Preparing', 'Ready', 'Dispatched', 'Completed'].map((s, si, arr) => (
                      <React.Fragment key={s}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--primary)' }}>{s}</span>
                        {si < arr.length - 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>→</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Ecosystem CTA Banner */}
      <section style={{ padding: '100px 0', background: 'radial-gradient(circle at center, var(--primary-light) 0%, #ffffff 100%)', textAlign: 'center' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '720px', margin: '0 auto', padding: '0 var(--space-md)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Join the Ecosystem</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.15, color: 'var(--text-main)' }}>
            Grow With the JIVEXA <br />
            <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Healthcare Ecosystem</span>.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: '1.65' }}>
            Connect with patients, healthcare professionals, and the wider digital healthcare journey through one intelligent platform.
          </p>
          <Link
            to="/signup"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '1.05rem',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              textDecoration: 'none',
            }}
          >
            Become a JIVEXA Pharmacy Partner →
          </Link>
        </div>
      </section>

    </div>
  );
};


// --- FAQ PAGE ---
export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is JIVEXA Health OS a substitute for direct medical services?',
      a: 'No. JIVEXA Health OS is an informational technology platform. It assists patients in organizing records and understanding diagnostic terms, and links patients to verified physicians. It does not provide direct medical advice, diagnoses, or treatments.'
    },
    {
      q: 'How does the JIVEXA Health AI Bot work?',
      a: 'The AI Assistant leverages natural language models to process questions, explaining complex reports or symptoms in simple terms. It strictly operates as an educational helper and directs users to emergency care channels for potentially severe conditions.'
    },
    {
      q: 'Is my health data secure on JIVEXA?',
      a: 'Security is our core priority. Health files are restricted using role-based permissions. Only you can decide which physicians have access to review your health reports and emergency details.'
    },
    {
      q: 'How do I schedule an appointment on JIVEXA?',
      a: 'Log into your patient dashboard, click "Find Doctors", filter by medical specialty, select a verified practitioner, pick an available date/time slot, and confirm. You will receive immediate dashboard alerts and updates.'
    }
  ];

  return (
    <div className="container" style={{ padding: '60px var(--space-md)', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <h1 className="text-center" style={{ fontWeight: 800 }}>Frequently Asked Questions</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div 
              key={idx}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'white',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-main)'
                }}
              >
                <span>{faq.q}</span>
                <HelpIcon size={18} style={{ color: 'var(--primary)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {isOpen && (
                <div style={{
                  padding: '0 24px 20px 24px',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.6',
                  borderTop: '1px solid var(--surface-raised)'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- CONTACT PAGE ---
export const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '', inquiryType: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
    setForm({ name: '', email: '', message: '', inquiryType: '' });
  };

  return (
    <div className="container" style={{ padding: '60px var(--space-md)', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '2.5rem' }}>Let's Build the Future of Healthcare Together.</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', marginTop: '16px' }}>Have a question, want to partner with JIVEXA, or interested in joining our healthcare ecosystem? We'd love to hear from you.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px' }} className="grid-2-mobile">
        <Card title="Send a Message">
          {submitted ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={24} style={{ margin: 'auto' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Inquiry Received</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Thank you for contacting JIVEXA. Our team will review and respond to you within 24 hours.
              </p>
              <Button variant="outline" onClick={() => setSubmitted(false)} style={{ marginTop: '12px' }}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Full Name" 
                placeholder="Mayank Gangwar" 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input 
                  label="Email Address" 
                  type="email" 
                  placeholder="mayank@jivexa.in" 
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Select
                  label="Inquiry Type"
                  options={['Patient Support','Doctor Partnership','Pharmacy Partnership','Business Partnership','General Inquiry']}
                  value={form.inquiryType}
                  onChange={(val) => setForm({ ...form, inquiryType: val })}
                  required
                />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Message</label>
                <textarea 
                  rows={4} 
                  placeholder="How can we assist you?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                  required
                />
              </div>
              <Button type="submit">Submit Inquiry</Button>
            </form>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Mail size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Email Inquiries</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <a href="mailto:jevixaofficial@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>jevixaofficial@gmail.com</a>
                </p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Phone size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Phone Hotline</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <a href="tel:+919105539049" style={{ color: 'inherit', textDecoration: 'none' }}>+91 9105539049</a>
                </p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Mail size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Partnership Inquiries</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>For doctors, pharmacies, healthcare organizations, and technology partners.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- RESOURCES / BLOG ---
export const Resources: React.FC = () => {
  const articles = [
    { title: 'Understanding Lipid Profiles: A Simple Guide', category: 'Diagnostics', readTime: '5 min read', desc: 'Decoding cholesterol counts, LDL, HDL, and triglycerides without feeling lost in laboratory terms.' },
    { title: 'Symptom Trackers: Preparing for Doctor Consults', category: 'Patient Support', readTime: '4 min read', desc: 'Simple guidelines to compile health timelines and checklists before meeting your practitioner.' },
    { title: 'Asthma Management & Trigger Identification', category: 'Chronic Care', readTime: '6 min read', desc: 'Helpful parameters to identify pollen, temperature, or chemical triggers affecting bronchial paths.' }
  ];

  return (
    <div className="container" style={{ padding: '60px var(--space-md)', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontWeight: 800 }}>Health Resources & Guides</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', marginTop: '16px' }}>
          Educational summaries to simplify diagnostic procedures.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }} className="grid-3-mobile">
        {articles.map((art, idx) => (
          <Card 
            key={idx} 
            title={art.title} 
            subtitle={<div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>{art.category}</span> • <span>{art.readTime}</span>
            </div>}
            hoverable
          >
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>{art.desc}</p>
            <Button variant="text" style={{ padding: 0 }}>Read Article →</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- PRIVACY POLICY ---
export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container" style={{ padding: '60px var(--space-md)', maxWidth: '800px', lineHeight: '1.8' }}>
      <h1 style={{ fontWeight: 800, marginBottom: '24px' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Effective Date: August 4, 2026</p>
      
      <p style={{ marginBottom: '16px' }}>
        JIVEXA ("we", "our", "us") values your privacy. This Privacy Policy details how we handle user information registered on JIVEXA Health OS (jivexa.in).
      </p>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '24px 0 12px 0' }}>1. Information We Collect</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        We store basic profile data (name, email, phone) to manage role settings (Patient, Doctor, Pharmacy). Patients can option to upload medical records (PDF/PNG) and enter allergy logs, which remain strictly restricted to practitioner and pharmacy review based on user consent actions.
      </p>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '24px 0 12px 0' }}>2. Data Safety & Consent</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        We enforce role-based access control. Doctors cannot access patient documents unless the patient coordinates an appointment or shares profiles explicitly. We do not sell or monetize personal medical data.
      </p>
    </div>
  );
};

// --- TERMS AND CONDITIONS ---
export const Terms: React.FC = () => {
  return (
    <div className="container" style={{ padding: '60px var(--space-md)', maxWidth: '800px', lineHeight: '1.8' }}>
      <h1 style={{ fontWeight: 800, marginBottom: '24px' }}>Terms & Conditions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Effective Date: August 4, 2026</p>
      
      <p style={{ marginBottom: '16px' }}>
        Welcome to JIVEXA Health OS. By accessing jivexa.in, you agree to these Terms.
      </p>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '24px 0 12px 0' }}>1. Nature of Platform Services</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        JIVEXA Health OS is a software technology dashboard linking independent patients, medical practitioners, and pharmacies. JIVEXA does not provide clinical services, practice medicine, dispense pharmaceuticals, or review laboratory blood reports.
      </p>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '24px 0 12px 0' }}>2. User Integrity</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
        Users must submit accurate identification details during registration. Impersonating physicians or forging diagnostic records is strictly prohibited and will lead to immediate account termination.
      </p>
    </div>
  );
};

// --- DISCLAIMER ---
export const Disclaimer: React.FC = () => {
  return (
    <div className="container" style={{ padding: '60px var(--space-md)', maxWidth: '800px', lineHeight: '1.8' }}>
      <h1 style={{ fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Shield style={{ color: 'var(--error)' }} />
        Medical Disclaimer
      </h1>
      
      <div style={{ border: '1px solid var(--error-light)', backgroundColor: 'var(--error-light)', padding: '24px', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
        <p style={{ color: 'var(--error)', fontWeight: 600 }}>
          IMPORTANT: JIVEXA Health OS does not provide medical services, professional diagnoses, or direct treatments.
        </p>
      </div>

      <p style={{ marginBottom: '16px' }}>
        All content displayed across the public website, including text summaries, diagnostic guidelines, and AI conversational responses, is intended for **general educational purposes only**.
      </p>

      <p style={{ marginBottom: '16px', fontWeight: 600 }}>
        Never disregard professional medical advice or delay seeking treatment because of information read on this platform.
      </p>

      <p style={{ color: 'var(--text-muted)' }}>
        If you believe you are experiencing a heart attack, severe allergic reaction, breathing emergency, or other clinical crisis, immediately call local emergency services or go to the nearest healthcare facility.
      </p>
    </div>
  );
};
