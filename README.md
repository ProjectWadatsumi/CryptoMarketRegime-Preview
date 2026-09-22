# CryptoMarketRegime-Preview

Public, read-only UI v1.0 preview for Project Wadatsumi.

Published browser scope:
- BTC-USD completed-candle charting
- causal Swing / HH-HL-LH-LL structure
- invalidation / transition markers
- W / D / 4H structure overlays and explanation evidence
- canonical 64-State classification
- research-candidate Crypto / USDC target
- local-only portfolio snapshot import and actual-vs-candidate gap
- local-only operation log and JSON export
- version attribution for later improvement review

Privacy and safety boundary:
- no wallet connection
- no private key or seed phrase
- no signing, approval, permit, swap, transfer, bridge, LP action, or transaction submission
- no production portfolio write
- Coinbase market data uses public GET endpoints only
- imported portfolio JSON is read locally by the browser and is not uploaded by this static preview
- operation-log records are stored in browser local storage unless the user explicitly exports them

Evidence boundary:
- Phase 7 historical simulation is completed retrospective evidence
- the allocation policy remains a research candidate
- productionAdopted = false
- executionAuthorized = false
- N0 / N1 research is not included in this UI version

This public display is derived from verified private UI v1.0 head:
`004a123a8182b11fca6ff8ce561b6fa95461e8c0`

Private-source verification:
- Draft PR #33
- Run #79 (`35681399799`) completed successfully
- iPhone-width browser smoke PASS
- Phase 2–11 read-only safety boundary PASS
