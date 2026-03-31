export function TopBar() {
  return (
    <div className="flex items-center h-12 px-4 bg-gray-900 text-white shrink-0 gap-4">
      <div className="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-orange-400">
          <path d="M12 2C8 6 4 10 4 14a8 8 0 0016 0c0-4-4-8-8-12z" fill="currentColor" opacity="0.8" />
          <path d="M12 8c-2 3-4 5-4 7a4 4 0 008 0c0-2-2-4-4-7z" fill="currentColor" />
        </svg>
        <span className="font-semibold text-sm tracking-wide">Maildrop</span>
      </div>
    </div>
  )
}
