const wax = new waxjs.WaxJS({
  rpcEndpoint: 'https://wax.greymass.com',
  tryAutoLogin: false
});

var loggedIn = false;
var anchorAuth = "owner";
const collection = "reaper";
const contract_owner_name = "reaper";
var userAccountName = "";

//45.84.0.218

const dapp = "reaper";

  async function wallet_isAutoLoginAvailable() {
    const transport = new AnchorLinkBrowserTransport();
    const anchorLink = new AnchorLink({
      transport,
      chains: [{
        chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        nodeUrl: 'https://wax.greymass.com',
      }],
    });
    var sessionList = await anchorLink.listSessions(dapp);
    if (sessionList && sessionList.length > 0) {
      useAnchor = true;
      return true;
    } else {
      useAnchor = false;
      return await wax.isAutoLoginAvailable();
    }
  }

  async function selectWallet(walletType) {
    wallet_selectWallet(walletType);
    login();
  }

  async function wallet_selectWallet(walletType) {
    useAnchor = walletType == "anchor";
  }

  function logout() {
    loggedIn = false;
  }

  async function login() {
    try {
      // alert("login");
        const userAccount = await wallet_login();
        userAccountName = userAccount.toString();
        username = userAccount.toString();
        // myGameInstance.SendMessage(
        //   "GameController",
        //   "SetUserName",
        //   userAccount === undefined ? " " : username
        // );
        const wax_balance = await get_balance(username);
        //balance = balance.toString();
        
        console.log("controller", username, wax_balance);

        loggedIn = true;

        main(userAccount);

        myGameInstance.SendMessage(
          "EventManager",
          "SetUserName",
          userAccount === undefined ? " " : (username)
        );

        myGameInstance.SendMessage(
          "EventManager",
          "SetUserBalance",
          userAccount === undefined ? " " : (wax_balance)
        );

        
    } 
    catch (e) {
      
    }
  }

  async function get_balance(wallet_userAccount) {
    let balance = await wax.rpc
      .get_currency_balance("eosio.token", wallet_userAccount, "wax")
      .then((res) => {
        console.log("balance", res[0]);
        // setBalance(res[0]);
        return res[0];
      })
      .catch((err) => {
        console.log("err", err);
        return "0";
      });
      return balance;
  }

  async function wallet_login() {
    const transport = new AnchorLinkBrowserTransport();
    const anchorLink = new AnchorLink({
      transport,
      chains: [{
        chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
        nodeUrl: 'https://wax.greymass.com',
      }],
    }); 
    if (useAnchor) {
      var sessionList = await anchorLink.listSessions(dapp);
      if (sessionList && sessionList.length > 0) {
        wallet_session = await anchorLink.restoreSession(dapp);
      } else {
        wallet_session = (await anchorLink.login(dapp)).session;
      }
      wallet_userAccount = String(wallet_session.auth).split("@")[0];
      auth = String(wallet_session.auth).split("@")[1];
      anchorAuth = auth;
    } else {
      wallet_userAccount = await wax.login();
      wallet_session = wax.api;
      anchorAuth = "active";
    }
    return wallet_userAccount;
  }

// get assets
  const main = async (account) => {

      let assets = await GetAssets(account);

      console.log("get assets => ", assets);

      var atomicData = [];
      for (var i = 0; i < assets.length; i ++) {
        var tmp = {};
        tmp.asset_id = assets[i].asset_id;
        tmp.templateid = assets[i].template.template_id;
        tmp.rarity = assets[i].data.name;
        tmp.name = assets[i].data.name;
        atomicData.push(tmp);
      }

      var msg = {"Items" : atomicData};

      myGameInstance.SendMessage(
        "EventManager",
        "setAssets",
        JSON.stringify(msg)
      );
    
  }

  const GetAssets = async (account) => {
    let results = [];
    
    console.log("userAccoun t = = ", account);
    var path = "atomicassets/v1/assets?collection_name=" + collection + "&owner=" + account + "&page=1&limit=1000&order=desc&sort=asset_id";
    const response = await fetch("https://" + "wax.api.atomicassets.io/" + path, {
      headers: {
        "Content-Type": "text/plain"
      },
      method: "POST",
    });
    const body = await response.json();
    if (body.data.length != 0)
      results = body.data;
    return results;
  }

  //-------------------------stake, unstake, claim
  const startCountDown = () => {
    console.log("start countdown ...");
  }

  const stopCountDown = () => {
    console.log("stop countdown ...");
  }

  const stake = async (asset_id) => {
    
    console.log("in Javascript", asset_id);

    var id_list = [];
    id_list.push(parseInt(asset_id));

    console.log(parseInt(asset_id));

    if (!wallet_session || userAccountName == "") {
      console.log('* Login first *');
    }
    try {
        const result = await wallet_session.transact({
            actions: [{
                account: "atomicassets",
                name: 'transfer',
                authorization: [{
                    actor: userAccountName,
                    permission: 'active',
                }],
                data: {
                    from: userAccountName,
                    to: contract_owner_name,
                    asset_ids: id_list,
                    memo: 'Oil',
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30
        });
        
        if(result) {
          startCountDown();
          $.post("http://45.84.0.218:5000/reaper/stake",
          {
            name: userAccountName, 
            asset_id: id_list,
            memo : "Oil"
          },
          function(data,status){

          });
          stakeSuccess(asset_id);
          setTimeout(function(){main(userAccountName)}, 1000);
        }
        else {
          console.log("result value is null, stake request faild!!!");
        }

    } catch (e) {
        
        console.log("An error is occured in stake");
        console.log(e);
    }
  }

  const unstake = async (asset_id) => {
    
    console.log("in Javascript", asset_id);

    var id_list = [];
    id_list.push(parseInt(asset_id));

    console.log(parseInt(asset_id));

    if (!wallet_session || userAccountName == "") {
      console.log('* Login first *');
    }
    try {
        const result = await wallet_session.transact({
            actions: [{
                account: contract_owner_name,
                name: 'unstake',
                authorization: [{
                    actor: userAccountName,
                    permission: 'active',
                }],
                data: {
                    username: userAccountName,
                    unstakeID: id_list,
                    memo: 'Oil',
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30
        });
        
        if(result) {
          stopCountDown();
          $.post("http://45.84.0.218:5000/reaper/unstake",
          {
            name: userAccountName, 
            asset_id: id_list,
            memo : "Oil"
          },
          function(data,status){

          });
          console.log("unstake success sned===========================================");
          unStakeSuccess(asset_id);
          setTimeout(function(){main(userAccountName)}, 1000);
        }
        else {
          console.log("result value is null, stake request faild!!!");
        }

    } catch (e) {
        console.log("An error is occured in unstake");
        console.log(e);
    }
  }


  const stakeSuccess = (asset_id) => {
    myGameInstance.SendMessage(
      "EventManager",
      "stakeSuccess",
      asset_id
    );
  }

  const unStakeSuccess = (asset_id) => {
    myGameInstance.SendMessage(
      "EventManager",
      "unStakeSuccess",
      asset_id
    );
  }

  const claim = async (asset_id) => {
    
    console.log("in Javascript", asset_id);

    var id_list = [];
    id_list.push(parseInt(asset_id));

    console.log(parseInt(asset_id));

    if (!wallet_session || userAccountName == "") {
      console.log('* Login first *');
    }
    try {
        const result = await wallet_session.transact({
            actions: [{
                account: contract_owner_name,
                name: 'claim',
                authorization: [{
                    actor: userAccountName,
                    permission: 'active',
                }],
                data: {
                    username: userAccountName,
                    assets_id: id_list,
                    memo: 'claim',
                },
            }]
        }, {
            blocksBehind: 3,
            expireSeconds: 30
        });
        
        if(result) {
          console.log("get claim successfully");
          $.post("http://45.84.0.218:5000/reaper/claim",
          {
            name: userAccountName, 
            asset_id: id_list,
            memo : "Oil"
          },
          function(data,status){

          });
          setTimeout(function(){main(userAccountName)}, 1000);

          myGameInstance.SendMessage(
            "EventManager",
            "claimSuccess",
            asset_id
          );
          
        }
        else {
          console.log("result value is null, stake request faild!!!");
        }

    } catch (e) {
        console.log("An error is occured in claim");
        console.log(e);
    }
  }

  const getStakedList = () => {

    console.log("getStakedList request sent");

    $.post("http://45.84.0.218:5000/reaper/"+userAccountName,
    {
      
    },
    function(data,status){

      let result = [];
      for (let elem of data) { // You can use `let` instead of `const` if you like
        for (let nft of elem.nfts) {
          var tmp = {};
          tmp.asset_id = nft;
          tmp.machine = elem.machine;
          tmp.lefttime = elem.lefttime;
          result.push(tmp);
        }
      }

      console.log("from server ===>>>> ", result);

      var msg = {"Items" : result};
      myGameInstance.SendMessage(
        "EventManager",
        "setStakedList",
        JSON.stringify(msg)
      );
    
    });
  }