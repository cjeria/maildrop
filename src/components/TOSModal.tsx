import { useState } from 'react'

const TOS_KEY = 'maildrop_tos_accepted'

export function useTOSAccepted() {
  return localStorage.getItem(TOS_KEY) === 'true'
}

export function TOSModal({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false)

  const handleAccept = () => {
    localStorage.setItem(TOS_KEY, 'true')
    onAccept()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-lg shadow-2xl w-[500px] max-w-full mx-4 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Terms of Use</h2>
        <div className="space-y-3 text-sm text-gray-700 mb-6">
          <p>
            <strong>Lawful use only.</strong> This tool may only be used for lawful purposes. You agree not to use it to send unsolicited, deceptive, or illegal communications.
          </p>
          <p>
            <strong>Your compliance responsibility.</strong> You are solely responsible for ensuring all campaigns comply with applicable law, including the CAN-SPAM Act, GDPR, and CASL. This includes maintaining valid opt-in consent, providing accurate sender information, and including a functioning unsubscribe mechanism in every commercial email.
          </p>
          <p>
            <strong>No liability.</strong> The provider of this tool accepts no liability for misuse, regulatory violations, or any harm arising from campaigns created with this tool.
          </p>
        </div>
        <label className="flex items-start gap-2 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to these terms.
          </span>
        </label>
        <button
          onClick={handleAccept}
          disabled={!checked}
          className="w-full py-2 text-sm font-medium bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          I agree and continue
        </button>
      </div>
    </div>
  )
}
