export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8">
      <div>
        <h2 className="text-xl font-semibold">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-sm text-gray-600 hover:text-black">
          Notifications
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-semibold">
          A
        </div>
      </div>
    </header>
  );
}