import { getGlobalTokenState } from "@/lib/ujian/token-live-actions"
import { TokenLiveDisplay } from "@/components/ujian/token-live-display"

export default async function TokenLivePage() {
  const state = await getGlobalTokenState()
  return <TokenLiveDisplay initialState={state} />
}
