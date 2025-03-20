0xE6f56434e3283861536157bed80ed756CB6390c5 -> mockPriceOracle.sol TxHash-> https://scan.test2.btcs.network/tx/0x83ff361cf00e789d83a61bc4ad0742f2c787caace0c27877a0a3d6ecc3cea91d

0x9e42e9D0f548314415833C5F3d69C95774E6c395-> MockWeth.sol TxHash-> https://scan.test2.btcs.network/tx/0x330da48847112c182212175a7128331178dd887e62bafd09ab9301bdba0f2a26

0x579721ACfFeDD19dC61685d496E68ee346aA100a -> MockBTC.sol txhash -> https://scan.test2.btcs.network/tx/0x48f3ded9097cd2bd104ac24d50d9ca8791033b52ff157dbc536960cc433de009

0xb8031099535532D4D5407616153F84f54DADa389 -> lendingProtocol.sol txHash -> https://scan.test2.btcs.network/tx/0xaabc66310ed04749a1b02a70ef0bd07e149ac1368ef7d1ac7b96af989792be3c

0x7d4829CC2a64517E52F538a2bDD83841Dcf8349b -> DualTokenYieldVault.sol txHash -> https://scan.test2.btcs.network/tx/0x793f083ad91482218ecd4121240a17348434a7016b57283d36bfd82d4477ad55

0x0AC13581b7797E0c94d82966e6eF65654C193f5B -> USDT txHash -> https://scan.test2.btcs.network/tx/0x6fdb9b55e8ed0a076032c733e44fec204353590629ec9ef122d40c553398ed6b

0x14f58BeB7b9A25DF974c1BE245A7385B425337B3 -> USDC txHash -> https://scan.test2.btcs.network/tx/0x45c81738b6669c83e5c4534d754f6c269926fd7fb29dc2e1db3ddbd97ea7fc8a

0x2EeC315014d29Bf65117aaC32eA6eb165C083cF7 -> lstBtcToken txHash ->

0x61F05C96f3B94dF2FDc7e8E75e80f78B1e21250A -> BTCCollateralizedLending.sol

0x4cb61fa894795B6252242A0186bb13a2A5F42142 -> LoanReciever.sol txHash -> https://scan.test2.btcs.network/tx/0x56925712456eaac5a150f803b49916c089a20683654f3aa592dc880671eb07c0 (LsBTC token passed as the constructor)

0xC94f840066C6fa664CA96Dc8c8f499B77b7E57ad -> InsurancePool.sol(auto-approval) (lstBtC(below) token passed as constructor) - working

0x9F384C8dA02CBFA67CE9b3BDddED49c7bB327dc9 -> LstBTC (Owner being our address ; above contract is vaultAddress being owner)

0x19079b097C72e5A2520Ee4fA8Ef1B9f9DDd75Fcf -> FlashLoan.sol(transfers the lstBTC to the insurancePool)

0x6E3f2C97B4Ab1c45AA324fD69A8028EE8a6055Ae -> Faucet.sol 

1,000,000,000,000,000,000,000
18 decimals for LstBTC,USDT,USDC
Backend needed for Flashloan(recent txs), Stablecoinloan(active loans), Insurance(active insurance and claim history), profile page