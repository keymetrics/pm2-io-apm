## 2.4.1 ( Thu Sep 13 2018 15:28:01 GMT+0200 (CEST) )


## Improvements
  - fix pmx version
  ([59a584e9](https://github.com/keymetrics/pm2-io-apm/commit/59a584e91e5b0951c9d02ab11dcf13d0a7421448))
  - fix channel for profiling
  ([48ad1e77](https://github.com/keymetrics/pm2-io-apm/commit/48ad1e77690cb05aa4c0c8115d59bdc074d28b84))






## 2.4.0 ( Thu Sep 13 2018 10:03:35 GMT+0200 (CEST) )


## Features
  - add duration/starttime/initiated to profilings
  ([814f8b64](https://github.com/keymetrics/pm2-io-apm/commit/814f8b64d5fde6f8f4b5291dec9c7c897d5cf84c))
  - use pm2-io-agent-node
  ([ccf5e91f](https://github.com/keymetrics/pm2-io-apm/commit/ccf5e91f5c4ebf07a6751c6a42cc49bc31725dc8))




## Improvements
  - add node < 8 compatibility
  ([60bc74ca](https://github.com/keymetrics/pm2-io-apm/commit/60bc74ca87e17cf141c2d1507b5810c60f2d1990))
  - fix pmx init
  ([4a1346c0](https://github.com/keymetrics/pm2-io-apm/commit/4a1346c04a4f62a60fd2fbeb27d5ff9815cca26a))
  - update agent-node and add option to send logs
  ([93c0465f](https://github.com/keymetrics/pm2-io-apm/commit/93c0465f5e134b542db96a9364280a587d2d714a))
  - use @pm2/agent-node and async
  ([8786ecd2](https://github.com/keymetrics/pm2-io-apm/commit/8786ecd25b0873a299557baa16253ffe2985ba24))
  - some fixs
  ([45503e30](https://github.com/keymetrics/pm2-io-apm/commit/45503e307b4e049e3d7b2c9ce2cceb76611584a5))
  - some improvments
  ([220a77ad](https://github.com/keymetrics/pm2-io-apm/commit/220a77ad2c0743c921f6458c73ab8bc2e69f31db))
  - stop storing coverage files
  ([a02ef3c6](https://github.com/keymetrics/pm2-io-apm/commit/a02ef3c626edc62d1fe941442042b094580b03bc))
  - send profiling via profiling event (bypass agent)
  ([fb1dbbb4](https://github.com/keymetrics/pm2-io-apm/commit/fb1dbbb4ae30c6aee0216fbd403d9d41d289e990))
  - don't store profiling in files #192
  ([96385909](https://github.com/keymetrics/pm2-io-apm/commit/9638590982e291effe959c6bcef7443c7d4f2a87))
  - fix some tests
  ([fe95ba2e](https://github.com/keymetrics/pm2-io-apm/commit/fe95ba2e3b266c5b0e46002a84702b83e35d479d))
  - use service manager everywhere
  ([78d01d1e](https://github.com/keymetrics/pm2-io-apm/commit/78d01d1eb9e6567f14e62f972f5119ba1cf11a59))
  - use service manager for transport
  ([ee4df6a3](https://github.com/keymetrics/pm2-io-apm/commit/ee4df6a3ad81482f69c1260e77d4753d30344fd9))




 

## 2.3.11 ( Fri Sep 07 2018 13:53:50 GMT+0200 (CEST) )


## Bug Fixes
  - do not destroy previous pmx instance of not update forced
  ([c694f622](https://github.com/keymetrics/pm2-io-apm/commit/c694f6225ea8cda2a45eeaad59ff06ba84c60392))




## Features
  - allow reinstanciation of PMX via PMX_FORCE_UPDATE
  ([056b2df7](https://github.com/keymetrics/pm2-io-apm/commit/056b2df7d5e661c5a5cf97929d02ec32fd294e4b))




## Chore
  - do not merge prev conf
  ([ff07e05f](https://github.com/keymetrics/pm2-io-apm/commit/ff07e05f16056270accf85d2a571cc9e5b70b762))





 
## 2.3.9 ( Fri Sep 07 2018 11:00:14 GMT+0200 (CEST) )


## Chore
  - clean unused import
  ([7e54f7f5](https://github.com/keymetrics/pm2-io-apm/commit/7e54f7f5048e3769f98da3738f1e911a4eecfeb2))





 
## 2.3.8 ( Wed Sep 05 2018 17:37:26 GMT+0200 (CEST) )


## Bug Fixes
  - fix multiple wrapper in case of already patched module
  ([dfaccd12](https://github.com/keymetrics/pm2-io-apm/commit/dfaccd12db9589bdea50e52628f02bcb0771be08))





 
## 2.3.7 ( Wed Sep 05 2018 15:33:50 GMT+0200 (CEST) )


## Bug Fixes
  - adapt test
  ([136eee9e](https://github.com/keymetrics/pm2-io-apm/commit/136eee9e50fce1e7a22b6609dcca50caed53e55f))
  - fix with auto init required
  ([3888f742](https://github.com/keymetrics/pm2-io-apm/commit/3888f742377a91aa4455baada222fdaa1a6cea98))
  - destroy previous pmx on new init
  ([6cbf0787](https://github.com/keymetrics/pm2-io-apm/commit/6cbf0787997d28e4a2549642744cd7a07ca20948))




## Test
  - fix test dependencies
  ([3136c553](https://github.com/keymetrics/pm2-io-apm/commit/3136c553372b0c9d4d4510863f11a3ed9278889d))







## 2.3.6 ( Tue Sep 04 2018 12:05:52 GMT+0200 (CEST) )


## Bug Fixes
  - set error flag by default
  ([05516adb](https://github.com/keymetrics/pm2-io-apm/commit/05516adb86655e009b4f215ab366fc4295eefd4b))






## 2.3.5 ( Tue Sep 04 2018 11:02:31 GMT+0200 (CEST) )


## Bug Fixes
  - make configuration optional
  ([11757e55](https://github.com/keymetrics/pm2-io-apm/commit/11757e55c1af5301b6baa61c383935616720bffd))
  - fix exception if no configuration is set to init
  ([c1d1c8b6](https://github.com/keymetrics/pm2-io-apm/commit/c1d1c8b68276da7c228c3b3f156f0065a7e29a9f))




## 2.3.4 ( Mon Sep 03 2018 16:55:21 GMT+0200 (CEST) )


## Bug Fixes
  - protect code if metric is not found
  ([7473d482](https://github.com/keymetrics/pm2-io-apm/commit/7473d4828f2438af878d205a4155560e976a3f17))
  - protect code if metric is not found
  ([ee9f4d1e](https://github.com/keymetrics/pm2-io-apm/commit/ee9f4d1ee28e47a31cdc72e0c305540e4ff67445))
  - do not autoexit if using cluster
  ([37867105](https://github.com/keymetrics/pm2-io-apm/commit/378671052022ebb94d3761daaa47ab19951f8171))




## Features
  - reuse configuration if multiple apm instantiation
  ([9881f61d](https://github.com/keymetrics/pm2-io-apm/commit/9881f61d861ca41d8594c601eab4d18a49301e9b))
  - prefix all internal metrics
  ([02d5613d](https://github.com/keymetrics/pm2-io-apm/commit/02d5613d6745c444b6cb819d59094c64b10185cc))
  - add get PID + Entrypoint extends PMX
  ([a8f4455b](https://github.com/keymetrics/pm2-io-apm/commit/a8f4455b35deee58b225b9e0949d7e877d5fa619))




## Refactor
  - separate entrypoint and pmx classes
  ([c3754c9e](https://github.com/keymetrics/pm2-io-apm/commit/c3754c9e38017a4c4d1109a2bdf2d5fcc431dc65))




## Chore
  - add example of module with entrypoint
  ([ec2b215b](https://github.com/keymetrics/pm2-io-apm/commit/ec2b215b966ecb522b230ee50f855f40a1ffde39))




## Branchs merged
  - Merge branch 'development'
  ([90a24f9e](https://github.com/keymetrics/pm2-io-apm/commit/90a24f9e4158f00ae0d623ae1738ddbeaa78c10c))
## 2.3.3 ( Fri Aug 31 2018 15:20:19 GMT+0200 (CEST) )


## Chore
  - upgrade event-loop-inspector to 1.2.0
  ([609bdde8](https://github.com/keymetrics/pm2-io-apm/commit/609bdde8fd57df42103ede5d4cb31258ee2e8e1c))
  - disable auto publish
  ([eacf9251](https://github.com/keymetrics/pm2-io-apm/commit/eacf9251597937884f980ae5452e072cca33e8d0))






## 2.3.2 ( Wed Aug 29 2018 11:33:27 GMT+0200 (CEST) )


## Performance improvement
  - disable async stracktrace by default
  ([a2640e59](https://github.com/keymetrics/pm2-io-apm/commit/a2640e59658e56abc21d3ddd27a9b9412c601554))




## Chore
  - fix lint
  ([b0534451](https://github.com/keymetrics/pm2-io-apm/commit/b0534451c8592fe1be73226540d5950cb0384e91))
  
  
  


# 2.3.1 ( Mon Aug 27 2018 17:09:07 GMT+0200 (CEST) )


## Bug Fixes
  - #178 fix TypeError when promise reject with a string
  ([9e78dca5](https://github.com/keymetrics/pm2-io-apm/commit/9e78dca56a2ceaf8a2f001933dccf8e17d2eb275))






# 2.3.0 ( Thu Aug 16 2018 13:06:16 GMT+0200 (CEST) )


## Bug Fixes
  - #176 protect code when getHeapStatistics returns no metrics
  ([f3858db9](https://github.com/keymetrics/pm2-io-apm/commit/f3858db990c38bc8e5e6c649d2c93efa72d84cf3))
  - #176 protect code when getHeapStatistics returns no metric
  ([3371d1a7](https://github.com/keymetrics/pm2-io-apm/commit/3371d1a796ca39a440360f67ae20be14c0bb6d95))
  - delay network download patching to avoid conflict with amq lib
  ([63078787](https://github.com/keymetrics/pm2-io-apm/commit/63078787b52e67b3ac032213f5d7a86731f856eb))




## Features
  - add coverage feature
  ([1ed766d2](https://github.com/keymetrics/pm2-io-apm/commit/1ed766d2955acb31d7674642a9e943c71a97c3be))
  - add file requests metrics + refactor metrics from dump
  ([c4416c32](https://github.com/keymetrics/pm2-io-apm/commit/c4416c32f04727cd656088073e4732abd3449723))




## Refactor
  - return as soon as possible
  ([15b4affb](https://github.com/keymetrics/pm2-io-apm/commit/15b4affbba641083440759d02af0fe357ae1483b))
  - disable coverage if node version is not compatible
  ([47f731f7](https://github.com/keymetrics/pm2-io-apm/commit/47f731f78375bddeb3cf29349c072fd33d78b569))
  - change default parameter value to make it work with node 4
  ([f01ecbfd](https://github.com/keymetrics/pm2-io-apm/commit/f01ecbfd138d86e3ec7ac32533690549f2f39ea0))




## Test
  - fix tests on node 10
  ([47ae4c29](https://github.com/keymetrics/pm2-io-apm/commit/47ae4c29f7d5a315b8df186d11cf287005e17703))
  - stabilize tests
  ([a60d7406](https://github.com/keymetrics/pm2-io-apm/commit/a60d74067b5305f129137907c88e613dc0772763))
  - stabilize test about file requests
  ([7860ac18](https://github.com/keymetrics/pm2-io-apm/commit/7860ac187a0f4dd77ae6483005d88f08d74bfbe7))
  - fix test on node 8
  ([1161b1a5](https://github.com/keymetrics/pm2-io-apm/commit/1161b1a5f3c7e9ad91507e1c0c194277560b3d21))




## Chore
  - better usage of context
  ([3cf7a364](https://github.com/keymetrics/pm2-io-apm/commit/3cf7a364a8e53b437db389c3e9f9bef3e8c0ca3b))
  - enable all tests
  ([5d96ed37](https://github.com/keymetrics/pm2-io-apm/commit/5d96ed377323a1f4a4e7db8ffaa90bf83b98a849))
  - add typings for all public methods
  ([d25f4f9b](https://github.com/keymetrics/pm2-io-apm/commit/d25f4f9bdd503855574024dab03573666c88ba5f))
  - exports typings
  ([dd81c1a1](https://github.com/keymetrics/pm2-io-apm/commit/dd81c1a14f4ae6d11fe779660c5a36f7b4129f44))
  - upgrade version to 2.2.0
  ([3844287d](https://github.com/keymetrics/pm2-io-apm/commit/3844287d496f5d56c2bf3d5de23aa14ae3d633c7))







# 2.2.0 ( Fri Aug 03 2018 15:20:16 GMT+0200 (CEST) )


## Bug Fixes
  - fix tslint errors
  ([7c8cea47](https://github.com/keymetrics/pm2-io-apm/commit/7c8cea47db25ef3dce1cab96d9dfb413b48196c4))




## Features
  - add worker metrics
  ([e099d969](https://github.com/keymetrics/pm2-io-apm/commit/e099d969a6efb8c2f82ec3f6ba4defc1aea4e05c))




# 2.1.3 ( Thu Jul 26 2018 17:58:05 GMT+0200 (CEST) )


## Hot Fixes
  - fix variable scope in deep metrics tracer to avoid memory leak
  ([0e194428](https://github.com/keymetrics/pm2-io-apm/commit/0e19442852e62539987146a6ff51eaf41d00e39d))




# 2.1.2 ( Wed Jul 25 2018 10:24:22 GMT+0200 (CEST) )


## Bug Fixes
  - check -1 fd for windows
  ([b17e060b](https://github.com/keymetrics/pm2-io-apm/commit/b17e060b82af2acc4dcb6bc81d685c1b056c3f17))
  - set options as empty object to avoid crash
  ([46a62a21](https://github.com/keymetrics/pm2-io-apm/commit/46a62a21b3ee693de2953012eeb5fb7c9ce3d502))


## Hot Fixes
  - better instantiation for debug module
  ([d3930df9](https://github.com/keymetrics/pm2-io-apm/commit/d3930df9305e7c2221da23b63cce2b6b08ae1f2d))





# 2.1.1 ( Mon Jul 23 2018 10:43:03 GMT+0200 (CEST) )


## Hot Fixes
  - better instantiation for debug module
  ([d3930df9](https://github.com/keymetrics/pm2-io-apm/commit/d3930df9305e7c2221da23b63cce2b6b08ae1f2d))


## Chore
  - upgrade version to 2.1.1
  ([e0f3dd00](https://github.com/keymetrics/pm2-io-apm/commit/e0f3dd00899244294fde3f6d7c95987384210a03))
  
  
  
  
  

# 2.1.0 ( Thu Jul 19 2018 16:53:33 GMT+0200 (CEST) )


## Bug Fixes
  - #147 seperate HTTP and HTTPS requests, important for apps which load both modules (http and https)
  ([78c944cc](https://github.com/keymetrics/pm2-io-apm/commit/78c944cc0b319123405ddfed4bf1f52c95078bc3))
  - #151 add environment variable to force inspector on node 8
  ([ecd0dba4](https://github.com/keymetrics/pm2-io-apm/commit/ecd0dba4dc0152973b3a3c0d0be00c19b9b1ade2))
  - #150 load event loop inspector module only once
  ([27fdf377](https://github.com/keymetrics/pm2-io-apm/commit/27fdf377203eb7a93eb3d625848da30149d320ae))
  - issue with keys function .... I should be tired !
  ([2fedff44](https://github.com/keymetrics/pm2-io-apm/commit/2fedff4405b134d55a94a48e1ffac9e5278cacf0))
  - #148 allow inspector only on node 10, else we can't handle multiple sessions
  ([58043f1b](https://github.com/keymetrics/pm2-io-apm/commit/58043f1bc58f098d6d4edca26a9360f132440941))
  - add precision in test when remove listener
  ([bc14c135](https://github.com/keymetrics/pm2-io-apm/commit/bc14c1353f0dc7063db8ddb206d9dad356f3d001))
  - check fd 1 and 2, can happen with pm2 and fork mode
  ([43cc2403](https://github.com/keymetrics/pm2-io-apm/commit/43cc2403f2b7711ba9501515e900ad90a093fa5b))




## Hot Fixes
  - #145 ensure apm removes all listeners to prevent event loop from running
  ([4ac7f64c](https://github.com/keymetrics/pm2-io-apm/commit/4ac7f64c6c061a1c33c5ab7c5ff4fa370c9bfe5a))
  - do not listen on process message if actions are not used
  ([c416d82f](https://github.com/keymetrics/pm2-io-apm/commit/c416d82f9a1b235308614948ca1701eddf197a20))




## Refactor
  - rename variable and stabilize tests
  ([29e77290](https://github.com/keymetrics/pm2-io-apm/commit/29e7729031439fd630004043be7883a6263be9ac))
  - #145 use event-loop-inspector as native module
  ([714a6ae4](https://github.com/keymetrics/pm2-io-apm/commit/714a6ae437e550bcc9b9a30112bb2ed8f7b83217))




## Test
  - exclude test on node 10 concerning v8-profiler module
  ([6588e431](https://github.com/keymetrics/pm2-io-apm/commit/6588e431d8f4e613079978006d3f4c0062684902))
  - do not install profiler module on node 10, it can break tests
  ([b508a88b](https://github.com/keymetrics/pm2-io-apm/commit/b508a88bc2a727462ea314a026885f5572f31e7b))
  - fix test on node 4/6
  ([e51dfb3e](https://github.com/keymetrics/pm2-io-apm/commit/e51dfb3e82dc9d1ef5cf043f94883dd6e3e5616f))
  - switch profiler module depending on node version
  ([675b7245](https://github.com/keymetrics/pm2-io-apm/commit/675b7245e84f3d9121f9a7bb9a52da3d543ce6b3))
  - clean test
  ([080a5e59](https://github.com/keymetrics/pm2-io-apm/commit/080a5e59ef1ca6f018baadc6c58371c9f55e4f11))
  - improve event loop inspector test
  ([c19b66a4](https://github.com/keymetrics/pm2-io-apm/commit/c19b66a48c3252eee474567cd6d3f902eca8fa4a))
  - try to stabilize test on event loop inspector module
  ([4096c5d5](https://github.com/keymetrics/pm2-io-apm/commit/4096c5d576f5c9ed9e639943bbff20cd2c6eff1a))
  - clean timer and destroy io when test is done
  ([291f3a12](https://github.com/keymetrics/pm2-io-apm/commit/291f3a12da479b7360147cf689e4b9f0b799d0f4))
  - decrease timeout for auto exit
  ([4a0c12d0](https://github.com/keymetrics/pm2-io-apm/commit/4a0c12d06890a00381572ab84a32718eb6e6f87e))
  - increase timeout for auto exit
  ([50579097](https://github.com/keymetrics/pm2-io-apm/commit/50579097176f36e5f282e47bbb8d525abab956e3))
  - align test with unref timers on node 8
  ([0c92b064](https://github.com/keymetrics/pm2-io-apm/commit/0c92b06479f3fd9f2f622cfce288f8a6fcf16c8b))
  - align test with unref timers on node 4/6
  ([9e48c381](https://github.com/keymetrics/pm2-io-apm/commit/9e48c3813139295a831e51d8034a12db06f4d92b))
  - align test with unref timers
  ([ade41be2](https://github.com/keymetrics/pm2-io-apm/commit/ade41be294dd5eb35ea58b411dfba8736b88f2f5))




## Chore
  - upgrade some packages
  ([b4cc2f57](https://github.com/keymetrics/pm2-io-apm/commit/b4cc2f573ea46e0501a5dca1d487315b3c2c13fb))
  - upgrade version to 2.1.0-beta5
  ([012c5868](https://github.com/keymetrics/pm2-io-apm/commit/012c5868c0f47ce54052c05ffbfdbc5022c53237))
  - upgrade version to 2.1.0-beta4
  ([4c0a04b7](https://github.com/keymetrics/pm2-io-apm/commit/4c0a04b778de95afcb2461bc500945a1ccc25302))
  - add publishing section in readme file
  ([522ef26b](https://github.com/keymetrics/pm2-io-apm/commit/522ef26b808a158ffe09363f6a58731cf44bdb62))
  - upgrade version to 2.1.0-beta3
  ([53dcaafa](https://github.com/keymetrics/pm2-io-apm/commit/53dcaafab3b9f721c677d48cf8af13cc11434357))
  - add prepublish hook to auto build sources
  ([a01b5f5d](https://github.com/keymetrics/pm2-io-apm/commit/a01b5f5d5bbdf80e44ebe3368e220e1947aae5f0))
  - update to 2.1.0-beta
  ([03cefe06](https://github.com/keymetrics/pm2-io-apm/commit/03cefe064194e266156001178db5c39a7993f652))
  - add node 10 on CI
  ([f645c69d](https://github.com/keymetrics/pm2-io-apm/commit/f645c69dc88a0506ff9a8a309c690be82ae0b891))




## Branchs merged
  - Merge branch 'master' of github.com:keymetrics/pmx-2
  ([f40e172f](https://github.com/keymetrics/pm2-io-apm/commit/f40e172feeaf235b8a3f85925c185ee68a633799))




# 2.0.3 ( Thu Jul 05 2018 17:43:57 GMT+0200 (CEST) )


## Bug Fixes
  - #137 catch exception if module is not install (avoid app to stop)
  ([d39bf5d4](https://github.com/keymetrics/pm2-io-apm/commit/d39bf5d4b1b03556d7feb66eb8f4650fe7c69281))
  - #141 set default level of notify to info + clean some "pmx" words
  ([ceefc142](https://github.com/keymetrics/pm2-io-apm/commit/ceefc1429264bfb5417b3d0e0a8efd6df77fcc20))
  - #141 set default level of notify to info + clean some "pmx" words
  ([8ac0d380](https://github.com/keymetrics/pm2-io-apm/commit/8ac0d3803c43dc327e52b8923c2b2929e51c5dce))


## Documentation
  - add documentation about metrics() and actions() method
  ([5536739a](https://github.com/keymetrics/pm2-io-apm/commit/5536739a65850497181205726d87d0ccc62c8009))



# 2.0.2 ( Wed Jun 27 2018 12:05:52 GMT+0200 (CEST) )


## Bug Fixes
  - #134 remove unused tracing system
  ([bad76339](https://github.com/keymetrics/pm2-io-apm/commit/bad76339032bdc2e9323b516a0c2e4a7f6bfd966))



## Documentation
  - add documentation about metrics() and actions() method
  ([5536739a](https://github.com/keymetrics/pm2-io-apm/commit/5536739a65850497181205726d87d0ccc62c8009))



## Chore
  - #130 update readme with inline metric creation
  ([bf73108d](https://github.com/keymetrics/pm2-io-apm/commit/bf73108d20a658ba5a600fc1a7da08ea234b2cca))
  - #130 update readme according to code
  ([f1f13579](https://github.com/keymetrics/pm2-io-apm/commit/f1f135798cdd6f53ddd3a034b1cf4cbee334380b))




# 2.0.1 ( Tue Jun 26 2018 10:21:19 GMT+0200 (CEST) )


## Hot Fixes
  - patch http and https module separately
  ([6bdf9501](https://github.com/keymetrics/pm2-io-apm/commit/6bdf9501606102df06a9a1076ec243c910f1776a))



# 2.0.0 ( Tue Jun 19 2018 16:39:57 GMT+0200 (CEST) )


## Bug Fixes
  - #125 change typo, replace PMX with PM2 IO
  ([4f8bb919](https://github.com/keymetrics/pm2-io-apm/commit/4f8bb9197be2b92a382c486c6951fef43a6a3498))
  - removed deprecated method
  ([f9b8f9ba](https://github.com/keymetrics/pm2-io-apm/commit/f9b8f9ba66d9c92718b53f5171edb9f5427ace47))
  - fix critical bug when using entrypoint. Some instructions where duplicated.
  ([53ad78e0](https://github.com/keymetrics/pm2-io-apm/commit/53ad78e0c1cd878b65818b5355f9acd6329b112b))
  - send code and signal to onStop + remove terminated message (can create some error message)
  ([e2265357](https://github.com/keymetrics/pm2-io-apm/commit/e2265357cef4aa04288ea563fcccadd23b9bef92))
  - fix "Name not defined" warning message
  ([123ff950](https://github.com/keymetrics/pm2-io-apm/commit/123ff95071171e2238d2e404e05c180decab1a40))
  - #100 fix max listeners warning
  ([6794e51b](https://github.com/keymetrics/pm2-io-apm/commit/6794e51b2d639039bc8cb724099152672d00847c))
  - remove unused parameter print in Transport.send
  ([45b0950e](https://github.com/keymetrics/pm2-io-apm/commit/45b0950eea58e5599aeee5a9d4a048311e847573))
  - notifyError should send correct data format to transport
  ([abc59fb7](https://github.com/keymetrics/pm2-io-apm/commit/abc59fb7c56b85dc5c18b5b4085cd1a3ae4d6aaf))
  - typo in debug message
  ([19422ecf](https://github.com/keymetrics/pm2-io-apm/commit/19422ecf649c5d1026642dfaced291c36c8df9ea))
  - #90 tslib necessary for node 4
  ([390bb25c](https://github.com/keymetrics/pm2-io-apm/commit/390bb25ce121225b0a0ac8d0802e04540b44292a))
  - #90 async necessary for node 4
  ([6b84aa24](https://github.com/keymetrics/pm2-io-apm/commit/6b84aa24f88c8de27a38928e09abf049e2505258))
  - #89 start deep metrics only if service is initialized
  ([3e018c9d](https://github.com/keymetrics/pm2-io-apm/commit/3e018c9d53666471540138621bc1ba678632c14a))
  - #89 #90 remove unused dependencies
  ([40bc9df0](https://github.com/keymetrics/pm2-io-apm/commit/40bc9df089f38b03ab1d2ba222de6e7d183853d3))
  - #89 change default configuration
  ([22cff6c0](https://github.com/keymetrics/pm2-io-apm/commit/22cff6c0cd1daaf98fd75fe7df396928fabcc239))
  - #84 refactor debug initialization
  ([9585eafd](https://github.com/keymetrics/pm2-io-apm/commit/9585eafd244af35be10e3f2d71d407e5a0bac1fd))
  - don't send true if profiling module is not loaded
  ([37744365](https://github.com/keymetrics/pm2-io-apm/commit/3774436588d8078a264043d29a654713a6a99f9f))
  - #77 return metric by key (clean special chars) and not full name
  ([5766cebc](https://github.com/keymetrics/pm2-io-apm/commit/5766cebce79c042de8202f22f8d75302a801f7af))
  - #69 activate configure module
  ([dbcfad39](https://github.com/keymetrics/pm2-io-apm/commit/dbcfad39974b79d46eec285ff1316531a233d9a8))
  - send application configuration even if not module
  ([27f63207](https://github.com/keymetrics/pm2-io-apm/commit/27f6320779180f52bb9eeb79ed606c21bd2982c8))
  - #66 escape spaces and special characters from metric's key
  ([957b2672](https://github.com/keymetrics/pm2-io-apm/commit/957b2672554a71882e7974502793db034d7bdb08))
  - #66 escape spaces and special characters form metric's name
  ([04816d44](https://github.com/keymetrics/pm2-io-apm/commit/04816d4403a2136e9ccb7742558d271ec68d915b))
  - fix test and create destroy method for actions service
  ([83afee10](https://github.com/keymetrics/pm2-io-apm/commit/83afee100a47f21478c592903bbe2ac56c9529eb))
  - #67 #62 activate profiling by default + remove error message because bad conf format
  ([078d2558](https://github.com/keymetrics/pm2-io-apm/commit/078d2558bc8be6c6095a5f25f4173ef5f83d8b5d))
  - #68 display a more useful deprecated message for emit function
  ([7f7ecb5e](https://github.com/keymetrics/pm2-io-apm/commit/7f7ecb5efdd6af6da03b12a3eea501ef7a74dc0e))
  - make init method synchronous for compatibility reason
  ([620f698a](https://github.com/keymetrics/pm2-io-apm/commit/620f698aad16a3b7bf6d58126b16bbe7afb79d51))
  - activate profiling by default
  ([f0e544a1](https://github.com/keymetrics/pm2-io-apm/commit/f0e544a1200d9149f11ec8de85118a07f46cee38))
  - remove listeners in destroy function
  ([5b574280](https://github.com/keymetrics/pm2-io-apm/commit/5b574280043cced5110f3ec655c7fa45a9a3e230))
  - don't force true in profiling conf if property exists
  ([25a215d6](https://github.com/keymetrics/pm2-io-apm/commit/25a215d63520c47c041e2010124a06a48ae0a84c))
  - change path in package.json + return instance from init() method
  ([c719a2c9](https://github.com/keymetrics/pm2-io-apm/commit/c719a2c98c9c96d860881c65712da0b075a91632))
  - transport should send full object
  ([ade1e233](https://github.com/keymetrics/pm2-io-apm/commit/ade1e233cb873624beca2fd25db56d64660899af))
  - add default when requiring module
  ([cd853aac](https://github.com/keymetrics/pm2-io-apm/commit/cd853aacd6a838f790cc0ff9cf56d75b40a6ce09))
  - fix unexpected error when closing profiler
  ([c5b9fa67](https://github.com/keymetrics/pm2-io-apm/commit/c5b9fa678f862b3385e03276c20d52c683c0e45b))
  - do not include v8-profiler as a dependency
  ([c48b81ad](https://github.com/keymetrics/pm2-io-apm/commit/c48b81ad1ccd06d890df728eb4ce8a7537c6c1b4))
  - fix issue with path
  ([bb65a594](https://github.com/keymetrics/pm2-io-apm/commit/bb65a5944efd834f86b5554f423e89b8a9bad191))
  - add argument checking on notify
  ([4864f5ad](https://github.com/keymetrics/pm2-io-apm/commit/4864f5ad67f4c393c5a49c54aeaa2a1ff992ba83))




## Hot Fixes
  - do not init transaction metrics multiple times
  ([3988f4fa](https://github.com/keymetrics/pm2-io-apm/commit/3988f4fa1baa64f9e781e39329bce4446348f222))
  - do not modify API if already exists
  ([c0a55c0a](https://github.com/keymetrics/pm2-io-apm/commit/c0a55c0afcf44ae1b06be3665878e57099674a7a))




## Features
  - #127 allow to disable exceptions catching by configuration
  ([f56b8937](https://github.com/keymetrics/pm2-io-apm/commit/f56b8937f177b89fdbba0eeda1601ab02719aea9))
  - #123 add action_type for every actions
  ([8562457e](https://github.com/keymetrics/pm2-io-apm/commit/8562457e3e760ef71b9987380f00320d126c9a49))
  - #119 make @pm2/io module a singleton and freeze its API
  ([029d8996](https://github.com/keymetrics/pm2-io-apm/commit/029d8996253fceef1b5d923be73faa9519530433))
  - improve onExit method, add code and signal
  ([b0e02801](https://github.com/keymetrics/pm2-io-apm/commit/b0e02801ff81c89f7196e1ba0238a3730d5784ac))
  - #106 add express error handler
  ([b8b9b192](https://github.com/keymetrics/pm2-io-apm/commit/b8b9b192ff5db36bbc3cec69d35a312a9e39340f))
  - #93 add test on probe().transpose()
  ([c7c7f874](https://github.com/keymetrics/pm2-io-apm/commit/c7c7f874fb4be7119fb22c761a6e044f99a910bc))
  - #93 add probe().transpose() as backward compatibility
  ([92cd9ccb](https://github.com/keymetrics/pm2-io-apm/commit/92cd9ccba6d800078274fb0919ebfe79f6d98273))
  - #60 add a ending message + create a default onStop method
  ([b68ad1fe](https://github.com/keymetrics/pm2-io-apm/commit/b68ad1fe8883a28217b51a525076585a9c982214))
  - #60 first entrypoint's implementation
  ([905607eb](https://github.com/keymetrics/pm2-io-apm/commit/905607ebcdaf603e3b3c149ef62f13f0e655e4e8))
  - add init module method
  ([335a775d](https://github.com/keymetrics/pm2-io-apm/commit/335a775d6e68d67fd9473b60c41c1270b6979e03))
  - add file size and unique id in profiling reply
  ([a23358ea](https://github.com/keymetrics/pm2-io-apm/commit/a23358eafdf740e593f5069abba67bacb8085d49))
  - enable default actions in conf
  ([8783d355](https://github.com/keymetrics/pm2-io-apm/commit/8783d35501f0467f1d5c35bab8a7fd8f0b4c88f5))
  - add backward compatibility on init configuration
  ([ace5bdc4](https://github.com/keymetrics/pm2-io-apm/commit/ace5bdc4b1fcacbcb488013181d828372f3602ef))
  - add notify backward compatibility + test
  ([5e137720](https://github.com/keymetrics/pm2-io-apm/commit/5e13772078cc00e5eddde822d9a6e8953ea922ed))
  - add event in api + test
  ([83f04350](https://github.com/keymetrics/pm2-io-apm/commit/83f0435047e38187b11d570b4beb6317474e2e1a))
  - backward compatibility about probe() function
  ([810546b2](https://github.com/keymetrics/pm2-io-apm/commit/810546b24180c2a0c8be1ce33825a800d5441d70))
  - add on exit handler
  ([fc97d1cc](https://github.com/keymetrics/pm2-io-apm/commit/fc97d1cc5d3f890904168bdef1d2b58758987a2b))
  - add transpose + test
  ([b4113fc5](https://github.com/keymetrics/pm2-io-apm/commit/b4113fc592bb713810dc6e8e8550e1ea155828f7))
  - add action and scoped actions + test
  ([0cf70dd0](https://github.com/keymetrics/pm2-io-apm/commit/0cf70dd08f2cebcab9c709231cc1521409fbb743))
  - add metric feature
  ([037d7de5](https://github.com/keymetrics/pm2-io-apm/commit/037d7de5af31d37db1e98a8c5d1744b30d700c08))
  - create API and add notifyError
  ([4e1910dc](https://github.com/keymetrics/pm2-io-apm/commit/4e1910dcb7c28fb3f4c1fee69c5e40fd0a36722f))
  - fallback to v8-profiler
  ([073342dc](https://github.com/keymetrics/pm2-io-apm/commit/073342dccee9528b3a46602601c2ef584392f63b))
  - add configuration to allow sampling interval
  ([68e6a570](https://github.com/keymetrics/pm2-io-apm/commit/68e6a570c77ac917f96e5b8a578332216b728216))
  - add heap dump + heap sampling action (+ tests)
  ([6bd089d4](https://github.com/keymetrics/pm2-io-apm/commit/6bd089d4ca750f50729a8f5d93691cde869f16b6))
  - add heap dump + heap sampling (with inspector only) + test
  ([e053512e](https://github.com/keymetrics/pm2-io-apm/commit/e053512ede61b3fffaa9db7a8a22b8cf94c23c66))
  - cpu profiling actions + test
  ([946d554c](https://github.com/keymetrics/pm2-io-apm/commit/946d554c4c1cd5a8a9e30ded9f6f3d7c1c261dd9))
  - manage profiling fallback for old nodejs version
  ([a9d2ad02](https://github.com/keymetrics/pm2-io-apm/commit/a9d2ad021ac5ce9f73d40240785b3a65e81cc2ed))
  - profiling, writing into a file
  ([7c24920c](https://github.com/keymetrics/pm2-io-apm/commit/7c24920c2a2d64c53a9528f6e2db90dfbd4e5f8d))
  - add events + test
  ([22485341](https://github.com/keymetrics/pm2-io-apm/commit/224853416023e67a4a4574c093bf8d1e3b8d1a26))
  - improve network configuration
  ([590a0f88](https://github.com/keymetrics/pm2-io-apm/commit/590a0f88540b27be179f141777ad523ede8adaa3))
  - add network metrics + test
  ([5e9d79be](https://github.com/keymetrics/pm2-io-apm/commit/5e9d79bedba4b0506cfa65f0696fbefd5f02831c))
  - enable tracing feature + test
  ([0cd8ad9f](https://github.com/keymetrics/pm2-io-apm/commit/0cd8ad9f5565be9d6b57291ea916bbef940ffc3f))
  - add http wrapper + configuration + proxy
  ([22d1aa24](https://github.com/keymetrics/pm2-io-apm/commit/22d1aa24e5a49648ede1566b3d39ce48d0523429))
  - add active handles/requests + test
  ([4fdbc3b7](https://github.com/keymetrics/pm2-io-apm/commit/4fdbc3b7be19c24b16be01c2e7c33fc5fc5e0c33))
  - add config and default value for services + fix test
  ([f9ff7833](https://github.com/keymetrics/pm2-io-apm/commit/f9ff7833447e6272216cb7ce9db29c37fcfa170a))
  - add event loop delay + test
  ([c41e1010](https://github.com/keymetrics/pm2-io-apm/commit/c41e1010cb908a7e79b0bd6561a089edff2be0ef))
  - add deep metrics + test
  ([506ecfaa](https://github.com/keymetrics/pm2-io-apm/commit/506ecfaa9b9a6e08e2a424d3f83f0db75113fbb8))
  - add event loop action + test
  ([c2e5883e](https://github.com/keymetrics/pm2-io-apm/commit/c2e5883e1e5e15d501558d33fa9e80ce8f91ee69))
  - add event loop action + test
  ([659a14f6](https://github.com/keymetrics/pm2-io-apm/commit/659a14f633ae039718788456b0b5e295802d0655))
  - add actions system + test
  ([efa7ce6a](https://github.com/keymetrics/pm2-io-apm/commit/efa7ce6ab7755ec90c995c375ca72f111cefe759))
  - destroy all metrics services when destroying metric feature
  ([55d397af](https://github.com/keymetrics/pm2-io-apm/commit/55d397af8beb2ffc3d6fb9fed71d69d0ed66f07d))
  - add all GC heap stats + add config utils method
  ([56e0db77](https://github.com/keymetrics/pm2-io-apm/commit/56e0db77c39df38c49354ae3c7edec28770151a6))
  - add all v8 heap stats
  ([99918a93](https://github.com/keymetrics/pm2-io-apm/commit/99918a93e7e0c447c6b0291864580123ea3e0105))
  - allow to load a conf for V8 metrics
  ([4990186e](https://github.com/keymetrics/pm2-io-apm/commit/4990186e8d1456e268fb8cc3b59c89a6652d5301))
  - add v8 probe
  ([24d6044e](https://github.com/keymetrics/pm2-io-apm/commit/24d6044e3f9b382f3ed155455c31aaf94ecbf7f5))
  - prepare and send data
  ([7a26db82](https://github.com/keymetrics/pm2-io-apm/commit/7a26db8290b31b023152bd62cbd1ab5d5d26e7af))
  - add transpose and metric
  ([aa7e02ee](https://github.com/keymetrics/pm2-io-apm/commit/aa7e02eebc88889a6330bc4ce35004be4d0c757d))
  - add transpose and metric
  ([31d94e65](https://github.com/keymetrics/pm2-io-apm/commit/31d94e656ff322c075ebef62f11e57866d6cd737))
  - add histogram metric
  ([044143dd](https://github.com/keymetrics/pm2-io-apm/commit/044143dd3260e3ea13d36cb0c1fa7e939808b784))
  - add counter metric
  ([7b6e4fd1](https://github.com/keymetrics/pm2-io-apm/commit/7b6e4fd111bc291b68c5bf121c33051815e30b48))
  - add probe system and meter probe (+ test)
  ([fc0f9694](https://github.com/keymetrics/pm2-io-apm/commit/fc0f969405eb47a39a9dc626d39048c5cb63939e))
  - add catchAll method to notify
  ([c987388f](https://github.com/keymetrics/pm2-io-apm/commit/c987388f072f0b0d7e7ae1ff6a04ae0836c2a682))




## Refactor
  - #98 rewrite readme examples according to changes introduced via API v2 refactoring.
  ([26b3430d](https://github.com/keymetrics/pm2-io-apm/commit/26b3430dec9dfcfb30d863b6289b435a8bf337ed))
  - #98 add histogram, metric, meter and counter method
  ([9a859920](https://github.com/keymetrics/pm2-io-apm/commit/9a85992026e6e5e7d89261f89aff8a3a35cadf17))
  - #98 switch metric() to metrics
  ([0bdb175c](https://github.com/keymetrics/pm2-io-apm/commit/0bdb175cd1e5f94b3498c6093b674a71af71c181))
  - #76 make Configuration a static class
  ([f92b301f](https://github.com/keymetrics/pm2-io-apm/commit/f92b301f14be16b72c8e93373da9fd3418bef43a))
  - make transport a static class
  ([9f4767bd](https://github.com/keymetrics/pm2-io-apm/commit/9f4767bdf11bf8166807a501de4c29c822b361b0))
  - switch console.log/error/warn to debug
  ([52a98789](https://github.com/keymetrics/pm2-io-apm/commit/52a987899a8dd811432d75460bc883571c8826d3))
  - destroy method for profiler feature/service
  ([9e333593](https://github.com/keymetrics/pm2-io-apm/commit/9e333593cab24e26a4e535f47d28e64424c01418))
  - change init in cpu profiling
  ([a76e1896](https://github.com/keymetrics/pm2-io-apm/commit/a76e1896de6419dc9a3088536dae33b0917a6fb8))
  - write a service for inspector session
  ([3ac80144](https://github.com/keymetrics/pm2-io-apm/commit/3ac80144f17db8934cddde6e6a9ba0994370fdb8))
  - remove unused code
  ([75ebda3f](https://github.com/keymetrics/pm2-io-apm/commit/75ebda3fce8abd426c660a6c7231e18be17e1285))
  - remove unused code
  ([b84df0cd](https://github.com/keymetrics/pm2-io-apm/commit/b84df0cdfe3ba33ff4dd342f4a99c06eb7511da5))
  - do not use inspector module with old node version
  ([4db9e761](https://github.com/keymetrics/pm2-io-apm/commit/4db9e76191356fe3280b6ff94ad8ca13d9f2ab7d))
  - create init method in profiling actions for async calls
  ([53c2ea72](https://github.com/keymetrics/pm2-io-apm/commit/53c2ea721709ebdbffae01f9cfbaa3abbbccf71a))
  - switch all init and destroy function to async/await
  ([2b2a84b3](https://github.com/keymetrics/pm2-io-apm/commit/2b2a84b3f15ada7cbbb1632190ab83a1ea662f02))
  - disable profiler when destroying cpu profiler
  ([7d639acd](https://github.com/keymetrics/pm2-io-apm/commit/7d639acd786ac2c6e6acac2ca77941b93c3d9d79))
  - add callback for profiler start, in case of error
  ([6c84c261](https://github.com/keymetrics/pm2-io-apm/commit/6c84c261e7e9fc628412587b60ba35f10974f24e))
  - change profiling interface's name
  ([5f55dd64](https://github.com/keymetrics/pm2-io-apm/commit/5f55dd641f2ab9bc967c8ce0c141ccfaac76a13c))
  - better error detection in case of module not found
  ([a25c5ef7](https://github.com/keymetrics/pm2-io-apm/commit/a25c5ef7a46052cf52424d9fdb0a141da164a8cf))
  - better error detection in case of module not found
  ([e776398c](https://github.com/keymetrics/pm2-io-apm/commit/e776398c0e242c6316bab75941e3df6c399c067c))
  - add check method
  ([e8200d02](https://github.com/keymetrics/pm2-io-apm/commit/e8200d02427098d8d3f77d4a7a0838ff6f364128))
  - remove self call and use arrow function
  ([2eac2c89](https://github.com/keymetrics/pm2-io-apm/commit/2eac2c89b7f32e69a3b19bcca5176ab278d2fae8))
  - rename probe to metrics
  ([9a224253](https://github.com/keymetrics/pm2-io-apm/commit/9a224253b4db7afdb0c68cbbc27e234b5369e66c))
  - remove unused code about stack trace
  ([4258a76c](https://github.com/keymetrics/pm2-io-apm/commit/4258a76c16fa37132198ac4a6bd83350367aa025))




## Test
  - fix api test
  ([05fa9e63](https://github.com/keymetrics/pm2-io-apm/commit/05fa9e6324968a20ca4252c519ed68f8232c2663))
  - add travis also
  ([0198794d](https://github.com/keymetrics/pm2-io-apm/commit/0198794d62a8e46ff196618437ffde52e73e0954))
  - fix tests after refactoring
  ([d2c66263](https://github.com/keymetrics/pm2-io-apm/commit/d2c662631739008e28631a7270bf68d7cf49370c))
  - fix test after initModule refactoring
  ([4309d57c](https://github.com/keymetrics/pm2-io-apm/commit/4309d57c3991910bd71f3e6ff72ef9a265b3763a))
  - fix test after initModule refactoring
  ([74a1f1e7](https://github.com/keymetrics/pm2-io-apm/commit/74a1f1e7585aa0c955c2ec309897ecdac8f1a31d))
  - add some coverage on destroy methods
  ([f3d1477b](https://github.com/keymetrics/pm2-io-apm/commit/f3d1477b459a350b36c2429dd16a26ad62c89928))
  - add tests on proxy utils
  ([3f5795ef](https://github.com/keymetrics/pm2-io-apm/commit/3f5795efc3f2f4374a3f7a08ead54a459274e90a))
  - add tests on json utils
  ([d41e3b45](https://github.com/keymetrics/pm2-io-apm/commit/d41e3b45983bb07a09547311012bc2603aff7091))
  - increase inspector test timeout
  ([e361fd28](https://github.com/keymetrics/pm2-io-apm/commit/e361fd286e1f4650f5ba3c5f8aecf4ec4caba8fa))
  - add test on initModule method
  ([b9da3230](https://github.com/keymetrics/pm2-io-apm/commit/b9da3230e1a8f993cae82eda793540b623e45926))
  - enable all tests on api
  ([65229db6](https://github.com/keymetrics/pm2-io-apm/commit/65229db6a599ebccfebad564c7acd0ded8212e7e))
  - add tests on initModule method
  ([97640139](https://github.com/keymetrics/pm2-io-apm/commit/97640139a5181b7e5d5fd039639e224538301ede))
  - stabilize test on api
  ([896e9bf4](https://github.com/keymetrics/pm2-io-apm/commit/896e9bf4a902abbc219b2e203198983f36bb168a))
  - reorganize test folder
  ([51419117](https://github.com/keymetrics/pm2-io-apm/commit/51419117a27dac1f526784c14ae27526adb15b53))
  - add test coverage on actions service
  ([31766401](https://github.com/keymetrics/pm2-io-apm/commit/3176640131a1500dae7a0f8d33479d0d6d063a0d))
  - install v8-profiler before some test (node 4 & 6)
  ([c4b1dabb](https://github.com/keymetrics/pm2-io-apm/commit/c4b1dabb0c82e5fa743d987f154e0c4122802b11))
  - increase api timeout to 20s
  ([b2caf173](https://github.com/keymetrics/pm2-io-apm/commit/b2caf17372f5e3bf1a66919dcac965d32ca27aba))
  - add test on backward compatibility about probe()
  ([62bbdaa7](https://github.com/keymetrics/pm2-io-apm/commit/62bbdaa7f97db62ea598e77360fb66c921bb446d))
  - add test on uncaught exception
  ([b6a96cfc](https://github.com/keymetrics/pm2-io-apm/commit/b6a96cfc194f036ce6dade9a49badf9fa034bd66))
  - add tests on transpose method
  ([7b96429c](https://github.com/keymetrics/pm2-io-apm/commit/7b96429cc05b9486a97bdc871846d315f88bb7bd))
  - make tests works on node 4
  ([455c0e00](https://github.com/keymetrics/pm2-io-apm/commit/455c0e00272591e1395fa08545180302317cf84b))
  - increase timeout on GC tests and add some expect instructions
  ([b7fcab02](https://github.com/keymetrics/pm2-io-apm/commit/b7fcab026c21c33ae7a2298f8280866cbbf1c799))
  - profiling test should wait initialization
  ([342768de](https://github.com/keymetrics/pm2-io-apm/commit/342768de028d172b53fe78119f2ac66fbab71c3d))
  - profiling test should wait initialization
  ([34402f6b](https://github.com/keymetrics/pm2-io-apm/commit/34402f6bca4ff9070d8ace3bbde7851c3b88510f))
  - increase timeout for CPU profiling
  ([b467c2a1](https://github.com/keymetrics/pm2-io-apm/commit/b467c2a18a8d8f872e7b00a7c34a2c33de5865d3))
  - add GC tests
  ([927cbba0](https://github.com/keymetrics/pm2-io-apm/commit/927cbba0795b203e61e14b9da068cb3ff31af761))
  - add coverage on transaction
  ([c11591a1](https://github.com/keymetrics/pm2-io-apm/commit/c11591a1a6f509e2cb2271792dd964a0dff7cbd7))
  - add coverage on configuration
  ([d2c3fe6b](https://github.com/keymetrics/pm2-io-apm/commit/d2c3fe6b4210fbe577fe060026b498bfb544d73f))
  - launch all tests in package.json
  ([c4ee6c8c](https://github.com/keymetrics/pm2-io-apm/commit/c4ee6c8c493db19a0b90c4731b736215584586ab))
  - switch takeSnapshot to stop for CPU profiling
  ([802158a1](https://github.com/keymetrics/pm2-io-apm/commit/802158a1e0d22584374eacc5ddb4cbcd8f97acea))
  - enable CPU profiling tests
  ([58066ef4](https://github.com/keymetrics/pm2-io-apm/commit/58066ef4808cef5f37393a8549b5c5dcb0e0b990))
  - increase timeout for CI
  ([2cb37595](https://github.com/keymetrics/pm2-io-apm/commit/2cb37595e2f9f3d99c00ec3baa9b454734d8a510))
  - add test on scoped actions
  ([65b920ba](https://github.com/keymetrics/pm2-io-apm/commit/65b920bac7ce4106603598acbdfe157d7cf41109))
  - add test on actions system
  ([8ab87d40](https://github.com/keymetrics/pm2-io-apm/commit/8ab87d40362c897e75e449ddb32e9a79c9f2839d))
  - add test to increase coverage
  ([0ac0e6e9](https://github.com/keymetrics/pm2-io-apm/commit/0ac0e6e9a19845b0b35dd1c0daf76d5ef0444818))
  - add test on transport
  ([8faa0a6a](https://github.com/keymetrics/pm2-io-apm/commit/8faa0a6a5d218e92cd450f14b41cb0605920ceef))
  - add test on probe init, destroy and timer
  ([29220faa](https://github.com/keymetrics/pm2-io-apm/commit/29220faad7118afb3164273eca8ca7ef300cab4d))
  - build files path + add utils functions
  ([06f919fc](https://github.com/keymetrics/pm2-io-apm/commit/06f919fc287c68e84a28717f1e23a2af0b69faa5))
  - add test on transport, improve coverage
  ([8d2e3c12](https://github.com/keymetrics/pm2-io-apm/commit/8d2e3c12359e83bc9d80e5fd18bdc071e82afd5a))
  - add test on transport when exception occurred
  ([3f0f821c](https://github.com/keymetrics/pm2-io-apm/commit/3f0f821cb248c5bd08e8b7ee98ba10ff5c8683be))
  - add test on transport
  ([0d02f58b](https://github.com/keymetrics/pm2-io-apm/commit/0d02f58bd1fd8e3bee2b1527e89defac3b90a366))




## Chore
  - upgrade version to 2.0.0-alpha33
  ([22313f7d](https://github.com/keymetrics/pm2-io-apm/commit/22313f7db3fe90570091b503022ccdd6d58db3fa))
  - upgrade version to 2.0.0-alpha31
  ([b825e95b](https://github.com/keymetrics/pm2-io-apm/commit/b825e95be12fe7d45cbd6faa4e520498f985e812))
  - upgrade version to 2.0.0-alpha30
  ([614828c6](https://github.com/keymetrics/pm2-io-apm/commit/614828c6541a676b3425d72f592dae158f4d8973))
  - upgrade version to 2.0.0-alpha27
  ([828b3128](https://github.com/keymetrics/pm2-io-apm/commit/828b312854bb8f676ba6fd426ab8c8ef7528b1d5))
  - update cli and repo url in readme
  ([5e794b58](https://github.com/keymetrics/pm2-io-apm/commit/5e794b58b9013527aa74ee2ff9815e1f22f1e6c0))
  - upgrade version to 2.0.0-alpha26
  ([922295ff](https://github.com/keymetrics/pm2-io-apm/commit/922295ff75e5c2c76e3cd4c0d0e52652e9b84b1d))
  - #19 fix documentation remove unnecessary code
  ([68bee27d](https://github.com/keymetrics/pm2-io-apm/commit/68bee27d3f08e46a6804dac974ddf78e7bf58b26))
  - #19 fix documentation when using network metric
  ([48b9e57c](https://github.com/keymetrics/pm2-io-apm/commit/48b9e57cf6c08f3f3b5155ec1a3e5d411c5550b0))
  - #19 fix documentation when using metric
  ([4d9888fb](https://github.com/keymetrics/pm2-io-apm/commit/4d9888fb8921c8257c82e68cafd451fc48f642e1))
  - #19 update readme with actions and metrics in conf
  ([586140bc](https://github.com/keymetrics/pm2-io-apm/commit/586140bc392787e85a457a7050480393a6d4b8d8))
  - #19 add documentation in readme file
  ([b92f629e](https://github.com/keymetrics/pm2-io-apm/commit/b92f629ef1d48c1169c31098cefe96b1365b5743))
  - upgrade version to 2.0.0-alpha25
  ([ab749f7e](https://github.com/keymetrics/pm2-io-apm/commit/ab749f7eeca8f6b2093db602394299080c403bb2))
  - upgrade version to 2.0.0-alpha24
  ([8ad4c621](https://github.com/keymetrics/pm2-io-apm/commit/8ad4c6217cf9678d9ac9a200ab07b6cd62a0cc91))
  - upgrade version to 2.0.0-alpha23
  ([21ca45bf](https://github.com/keymetrics/pm2-io-apm/commit/21ca45bf282a07ff7065167fba66e698b57bb62e))
  - upgrade version to 2.0.0-alpha22
  ([82c6a1e3](https://github.com/keymetrics/pm2-io-apm/commit/82c6a1e36a935fe19ed83475a4a3dd0943c88e55))
  - upgrade package version and fix lint errors
  ([4acb3995](https://github.com/keymetrics/pm2-io-apm/commit/4acb39950166d9616be78b7e06108e54f64cf913))
  - upgrade version to 2.0.0-alpha21
  ([349cf982](https://github.com/keymetrics/pm2-io-apm/commit/349cf9829e91f1c027fa326d3390fa46045b27e4))
  - upgrade version to 2.0.0-alpha20
  ([2a8cc635](https://github.com/keymetrics/pm2-io-apm/commit/2a8cc635d6fcaebe60766c28019709807e3d6f9e))
  - upgrade version to 2.0.0-alpha19
  ([dfd13983](https://github.com/keymetrics/pm2-io-apm/commit/dfd13983f9e6c01728add6b6a8efa7701745b2bb))
  - add author + update repo
  ([a9e40743](https://github.com/keymetrics/pm2-io-apm/commit/a9e40743352953aa8ecb3d669c7bb9704d709c6a))
  - v2.0.0-alpha18
  ([806a2e3b](https://github.com/keymetrics/pm2-io-apm/commit/806a2e3b476521d59c823b7a29ebda89d5d018bd))
  - pm2.io -> @pm2/io
  ([17801888](https://github.com/keymetrics/pm2-io-apm/commit/17801888193c38313c845fb2710c2d92c334b3dd))
  - add logs for manual actions
  ([695f250f](https://github.com/keymetrics/pm2-io-apm/commit/695f250fd61e2ea608e918a68e6969bd259f0589))
  - upgrade version to 2.0.0-alpha16
  ([6cb21328](https://github.com/keymetrics/pm2-io-apm/commit/6cb213283e974aba9385f050ffe016346aa3f391))
  - upgrade version to 2.0.0-alpha15
  ([44b6b262](https://github.com/keymetrics/pm2-io-apm/commit/44b6b262100554d6c0a5b084ced39e8ef96397ae))
  - pmx->pm2.io module
  ([a029bfe9](https://github.com/keymetrics/pm2-io-apm/commit/a029bfe96ce532052d34aee66968b27f55e631b9))
  - 2.0.0-alpha13
  ([b956c944](https://github.com/keymetrics/pm2-io-apm/commit/b956c94424b64a9bab39145b44bcee744d486f31))
  - ignore .idea folder when publishing
  ([bdb8373d](https://github.com/keymetrics/pm2-io-apm/commit/bdb8373df305c434fea3a53ee331ff0bdeb7fde0))
  - upgrade version to 2.0.0-alpha10
  ([601fb682](https://github.com/keymetrics/pm2-io-apm/commit/601fb682ff58bef5ed384de57a60bf3c72ac06b4))
  - upgrade deep metrics dependency
  ([1d2f2ac8](https://github.com/keymetrics/pm2-io-apm/commit/1d2f2ac8880a3e38e9981685530cfdbf6ee0c3cc))
  - only expose heap actions when available #50
  ([e1cc828c](https://github.com/keymetrics/pm2-io-apm/commit/e1cc828c05a3c11000273ef087e36fc19a6a30a7))
  - avoid crashing the application if profiler is not available
  ([15ecb13e](https://github.com/keymetrics/pm2-io-apm/commit/15ecb13e09c094092ed7b551ddfe9b30079746f0))
  - allow to use env variable to force profiling fallback
  ([c84a572d](https://github.com/keymetrics/pm2-io-apm/commit/c84a572dff4f803b63719e1a971792a409ed778d))
  - fix lint
  ([20aa7d72](https://github.com/keymetrics/pm2-io-apm/commit/20aa7d727a47b00beda21957d144f9779ff7f2e9))
  - add types and prepublish script
  ([0a2a24dd](https://github.com/keymetrics/pm2-io-apm/commit/0a2a24dd15dc1d3614678bf9f1f591febdfb8c5d))
  - launch test which where just under /test
  ([f99d262c](https://github.com/keymetrics/pm2-io-apm/commit/f99d262cf848636b18b5a311e88f9c68d8e3ac9d))
  - make tests/code working with node 4
  ([3a806a3d](https://github.com/keymetrics/pm2-io-apm/commit/3a806a3de257e77adedcce833e993ff28fc30837))
  - add package.json module
  ([562cb159](https://github.com/keymetrics/pm2-io-apm/commit/562cb159c3fbb7b6db7856a1513aba4d54887eba))
  - install modules with npm
  ([de48d4e4](https://github.com/keymetrics/pm2-io-apm/commit/de48d4e476a39a88e1892fafb6dcedafdcecd20c))
  - install modules with npm
  ([3e2e2062](https://github.com/keymetrics/pm2-io-apm/commit/3e2e206274abc401d32b2172bc1f7a479ec8c3fa))
  - class wording
  ([17296e01](https://github.com/keymetrics/pm2-io-apm/commit/17296e01ffc868fdb0b26a95aaf85e3891bf98ab))
  - split metrics feature and metrics service
  ([c5168518](https://github.com/keymetrics/pm2-io-apm/commit/c51685181ada1671dbf1e00f63896ec3a5e26f4c))
  - wording on debug
  ([3ef6e8ab](https://github.com/keymetrics/pm2-io-apm/commit/3ef6e8ab4b17853c65fbf0a5344546c88c506795))
  - remove unused console.log
  ([f0306bae](https://github.com/keymetrics/pm2-io-apm/commit/f0306bae0ad1ca24e42c2d8304b7a8dbc6c841a3))
  - remove unused console.log
  ([5d47fb14](https://github.com/keymetrics/pm2-io-apm/commit/5d47fb142a91a4f6fa422e3a830f3a937533ad6d))
  - switch internal _var Object to a map
  ([a7dc8c05](https://github.com/keymetrics/pm2-io-apm/commit/a7dc8c0568a49513999c3d1b7ea0df8377c5868b))
  - remove transpose, unused
  ([23355317](https://github.com/keymetrics/pm2-io-apm/commit/233553175bf30b8ae285ae7eff8fe8bf226b8a3b))
  - add ci config
  ([eaa75fff](https://github.com/keymetrics/pm2-io-apm/commit/eaa75fffc02e70abd3272fdd57efcff244a51a35))
  - switch internal _var Object to a map
  ([e52edfa6](https://github.com/keymetrics/pm2-io-apm/commit/e52edfa6f577ef33a348c0b2a33fcde40979bba4))
  - remove transpose, unused
  ([1ba38691](https://github.com/keymetrics/pm2-io-apm/commit/1ba38691509664b253767682f1c3a0a8875f1f67))
  - wording in test files
  ([dbb03d65](https://github.com/keymetrics/pm2-io-apm/commit/dbb03d650e8d4a3193dd487c3966b244571e6290))
  - remove unused chai-spies dependencies
  ([17b3b5ee](https://github.com/keymetrics/pm2-io-apm/commit/17b3b5eed6c552a85e0d693d505b4dc203d5b31b))
  - update readme
  ([1981a985](https://github.com/keymetrics/pm2-io-apm/commit/1981a985dc7fa2c0e9a0cac9b038fe3c6ed77523))
  - use mocha instead of ava
  ([eac7dac5](https://github.com/keymetrics/pm2-io-apm/commit/eac7dac57055093f979176707bee1cb9e5e24906))
  - setup project structure with a first example
  ([08f09c8a](https://github.com/keymetrics/pm2-io-apm/commit/08f09c8a3e90bd0364c484ae6e9eb57c81780df7))




## Branchs merged
  - Merge branch 'master' of github.com:keymetrics/pm2-io-apm
  ([aad2cd4f](https://github.com/keymetrics/pm2-io-apm/commit/aad2cd4fe92e757f1b52b5ca86d2f0129420a0ab))
  - Merge branch 'master' of github.com:keymetrics/pmx-2
  ([9168e8eb](https://github.com/keymetrics/pm2-io-apm/commit/9168e8eb9345cdf8b2e862623bd0e990202e9679))
  - Merge branch 'prepare_publish'
  ([4646f994](https://github.com/keymetrics/pm2-io-apm/commit/4646f994bb9cc8f1ae209b0b3d13050be98aa964))
  - Merge branch 'deep_metrics'
  ([50ae0a68](https://github.com/keymetrics/pm2-io-apm/commit/50ae0a687b428c5676cd8190babb034cb83b5521))
  - Merge branch 'master' of github.com:keymetrics/pmx-2 into deep_metrics
  ([f9c54527](https://github.com/keymetrics/pm2-io-apm/commit/f9c54527c38a52e64ce0f976bfb3c7b2a5ebd92f))
  - Merge branch 'metric_transpose'
  ([38e238a3](https://github.com/keymetrics/pm2-io-apm/commit/38e238a33346ba4f5f4a429fcada5e3ae09c952b))




## Pull requests merged
  - Merge pull request #5 from keymetrics/histogram
  ([60e5a747](https://github.com/keymetrics/pm2-io-apm/commit/60e5a747c67b918ca3a2597b1ac5da119872b2b3))
  - Merge pull request #4 from keymetrics/counter
  ([be69d2a1](https://github.com/keymetrics/pm2-io-apm/commit/be69d2a13c3d3be0651617e876b3470aa3755177))
  - Merge pull request #3 from keymetrics/setup_structure
  ([9b9625b3](https://github.com/keymetrics/pm2-io-apm/commit/9b9625b3ec051064b6f71e2e71c232d420568d8f))
  - Merge pull request #2 from keymetrics/setup_structure
  ([ee918939](https://github.com/keymetrics/pm2-io-apm/commit/ee9189392af37b4f2e4ac412d49193ca70c981ee))
  - Merge pull request #1 from keymetrics/setup_structure
  ([e1b8073b](https://github.com/keymetrics/pm2-io-apm/commit/e1b8073bc473b319a817701792d9f8c3fbdb8c41))





