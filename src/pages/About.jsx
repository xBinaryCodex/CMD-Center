import { Info, Zap } from 'lucide-react'

function Section({ label }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-4">
      <span className="text-ops-green font-bold text-xs tracking-widest">//</span>
      <span className="text-sm font-bold text-gray-100 tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-bunker-700" />
    </div>
  )
}

function FeatureItem({ children }) {
  return (
    <li className="flex items-start gap-3 py-1.5">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ops-green flex-shrink-0" />
      <span className="text-sm text-gray-300 leading-relaxed">{children}</span>
    </li>
  )
}

export default function About() {
  return (
    <div className="max-w-2xl mx-auto pb-12">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-ops-green" />
          <span className="text-xs text-gray-500 uppercase tracking-widest">About Aligned</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 leading-snug">The Real Story</h1>
        <p className="text-ops-green text-sm mt-1 tracking-wide">Why this exists — and why it keeps growing.</p>
      </div>

      {/* Opening */}
      <div className="space-y-4">
        <p className="text-base font-semibold text-gray-100 leading-relaxed">
          I didn't set out to build a productivity app.
        </p>
        <p className="text-base font-bold text-ops-green leading-relaxed">
          I set out to stop drowning.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          I was working full time, grinding through a degree, building a security business on the
          side, and trying to keep up with personal projects — all at the same time. I wasn't
          disorganized. I was just operating across too many fronts with no central view of any of it.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          So I built something for myself. Just a simple dashboard — a situation report of my life.
          What's active, what's moving, what needs attention. I called it my <span className="text-ops-green font-semibold">SITREP</span>.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          Then I kept adding to it. Not because I planned to — but because I kept running into the
          same problem. I'd have the big picture covered but I'd miss a deadline. So I added a
          Calendar. Then I had work tasks handled but personal to-dos were falling through the cracks.
          So I added a Task list. Every feature in this app exists because I personally needed it
          and nothing else was doing it in one place.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          But somewhere in the building, I realized something. I was organized — but I wasn't
          growing. I was executing, but I was running on empty. I knew <em>what</em> I was doing.
          I didn't always know <em>why</em>.
        </p>
        <p className="text-sm font-semibold text-gray-100 leading-relaxed">
          That's when I added Kaizen and Manifestation.
        </p>
      </div>

      {/* Why Kaizen */}
      <Section label="Why Kaizen" />
      <div className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          Kaizen is a Japanese philosophy — continuous improvement through small, consistent
          reflection. Every day, you log what happened, what you'd do differently, and what you
          learned. Not a long therapy session. Just a minute of honest self-observation.
        </p>
        <div className="border-l-2 border-ops-green/40 pl-4 py-1">
          <p className="text-sm text-gray-400 leading-relaxed italic">
            Most people skip this. And it's exactly why they keep hitting the same walls.
          </p>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          The people who actually improve aren't the ones who work the hardest — they're the ones
          who stop, reflect, and adjust. Kaizen makes that a daily habit built into the same place
          you run your life.
        </p>
      </div>

      {/* Why Manifestation */}
      <Section label="Why Manifestation" />
      <div className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          Because execution without intention is just productivity for its own sake.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          The highest performers — athletes, executives, Navy SEALs — they all have one thing in
          common beyond discipline: they know <em>exactly</em> what they're building toward and
          they remind themselves every single day. Affirmations, intentions, gratitude — this isn't
          soft. This is the mental programming that makes everything else sustainable.
        </p>
        <div className="border-l-2 border-purple-500/40 pl-4 py-1">
          <p className="text-sm text-gray-400 leading-relaxed italic">
            I added it because I noticed that when I knew <em>why</em> I was grinding, the grind
            felt different. Aligned gives you both — the structure to execute and the clarity to
            know what you're executing for.
          </p>
        </div>
      </div>

      {/* What It Became */}
      <Section label="What It Became" />
      <div className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          What started as a personal organization tool became a full life operating system.
          One place for:
        </p>
        <ul className="space-y-0.5 ml-1">
          <FeatureItem>Your <span className="text-gray-100 font-semibold">life domains</span> — career, business, school, projects, health</FeatureItem>
          <FeatureItem>Your weekly <span className="text-gray-100 font-semibold">battle plan</span></FeatureItem>
          <FeatureItem>Your <span className="text-gray-100 font-semibold">calendar</span></FeatureItem>
          <FeatureItem>Your <span className="text-gray-100 font-semibold">tasks</span></FeatureItem>
          <FeatureItem>Your <span className="text-gray-100 font-semibold">focus sessions</span></FeatureItem>
          <FeatureItem>Your daily <span className="text-gray-100 font-semibold">reflection</span></FeatureItem>
          <FeatureItem>Your <span className="text-gray-100 font-semibold">intentions and affirmations</span></FeatureItem>
        </ul>
        <p className="text-sm text-gray-400 leading-relaxed">
          Everything connected. Everything in one tab.
        </p>
      </div>

      {/* Who It's For */}
      <Section label="Who It's For" />
      <div className="space-y-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          If you're only managing one thing, you don't need Aligned.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          But if you're building a career <em>and</em> working on something on the side <em>and</em>{' '}
          trying to grow as a person — you know the feeling of having a lot in motion and no clear
          view of all of it.
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          Aligned was built for that person. The one who's doing the most and still wants to do
          it better.
        </p>
      </div>

      {/* Closing callout */}
      <div className="mt-12 p-5 rounded-xl border border-ops-green/20 bg-ops-green/5"
        style={{ boxShadow: '0 0 24px rgba(0,255,136,0.04)' }}>
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-ops-green flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 leading-relaxed italic">
            "Built by someone who had too much going on and not enough visibility.
            Then built for everyone like them."
          </p>
        </div>
      </div>

    </div>
  )
}
