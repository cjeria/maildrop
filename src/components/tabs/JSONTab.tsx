import { useCampaignStore } from '../../store/campaignStore'

export function JSONTab() {
  const store = useCampaignStore()

  // Pick only state (not functions)
  const stateSnapshot = {
    campaignName: store.campaignName,
    recipientName: store.recipientName,
    link: store.link,
    addresses: store.addresses,
    selectedAddress: store.selectedAddress,
    headerImage: store.headerImage,
    body: store.body,
    signature: store.signature,
    footerImage: store.footerImage,
    people: store.people,
    template: store.template,
    font: store.font,
    cornerRadius: store.cornerRadius,
  }

  return (
    <div className="p-3 h-full flex flex-col">
      <p className="text-xs text-gray-500 mb-2">Campaign state (read-only)</p>
      <textarea
        readOnly
        value={JSON.stringify(stateSnapshot, null, 2)}
        className="flex-1 w-full font-mono text-xs border border-gray-300 rounded-md p-3 bg-gray-50 resize-none focus:outline-none"
      />
    </div>
  )
}
