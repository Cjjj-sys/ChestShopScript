import {
  world,
  system,
  BlockLocation,
  MinecraftBlockTypes,
  Items,
  Player,
  BlockInventoryComponent,
  InventoryComponentContainer,
  EntityInventoryComponent,
  ItemStack,
  EffectType,
} from "@minecraft/server";
import { http, HttpClient, HttpHeader, HttpRequest, HttpResponse, HttpRequestMethod } from "@minecraft/server-net";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { variables } from "@minecraft/server-admin";

const toSendHttpUrl = "http://115.227.16.166:19144/";

async function sendBehaviorData(data: any) {
  let request = new HttpRequest(toSendHttpUrl);
  request.method = HttpRequestMethod.POST;
  request.addHeader("content-type", "application/json");
  request.body = JSON.stringify(data);
  http
    .request(request)
    .then((response) => {})
    .catch((error) => {});
}

async function sendActionData(data: any): Promise<string> {
  let request = new HttpRequest(toSendHttpUrl + "action");
  request.method = HttpRequestMethod.POST;
  request.addHeader("content-type", "application/json");
  request.body = JSON.stringify(data);
  let result = "";
  await http
    .request(request)
    .then((response) => {
      result = response.body;
    })
    .catch((error) => {
      result = error;
    });

  return result;
}

// world.events.beforeChat.subscribe(async (v) => {
//   world.say(v.message);
// });

// world.events.messageReceive.subscribe(async (v) => {
//   world.say(v.message);
//   world.say(v.id);
// });

const homeMenu = new ActionFormData();
homeMenu.title("家书菜单").button("设置家").body("在当前位置设置家").button("回家");

world.events.beforeItemUse.subscribe(async (v) => {
  if (v.item.typeId == "minecraft:book") {
    if (v.item.nameTag == "家书") {
      let player = v.source as Player;
      let homeMenuResult = await homeMenu.show(player as any);
      if (homeMenuResult.selection != undefined) {
        let messageBox = new MessageFormData();
        messageBox.button1("是的").button2("没有其他选择了");
        switch (homeMenuResult.selection) {
          case 0:
            messageBox.title("设置家结果");
            let playerName = player.name;
            let dimension = player.dimension.id;
            let location = player.location;
            location.x = Math.floor(location.x);
            location.y = Math.floor(location.y);
            location.z = Math.floor(location.z);
            if (dimension != "minecraft:overworld") {
              messageBox.body("错误: 只能在主世界设置家!");
            } else {
              let toSendData = {
                type: "homeSetAction",
                data: {
                  playerName: playerName,
                  location: location,
                },
              };
              let result = await sendActionData(toSendData);
              messageBox.body(result);
            }
            messageBox.show(player as any);
            break;
          case 1:
            messageBox.title("回家结果");
            let toSendData = {
              type: "homeGetAction",
              data: {
                playerName: player.name,
              },
            };
            let result = await sendActionData(toSendData);
            if (result != "") {
              messageBox.body(result);
              messageBox.show(player as any);
              let homeLocation = JSON.parse(result);
              player.teleport(homeLocation, world.getDimension("overworld"), 0, 0);
            } else {
              messageBox.body("错误: 清检查你是否设置了家!");
              messageBox.show(player as any);
            }
            break;
          default:
            break;
        }
      }
    }
  }
});

// world.events.entityHurt.subscribe(async (v) => {
//   world.say(v.hurtEntity.typeId);
//   v.hurtEntity.kill();
// });

world.events.itemStartUseOn.subscribe(async (v) => {
  let location = v.blockLocation;
  let block = v.source.dimension.getBlock(location);
  let blockComponent: BlockInventoryComponent = block.getComponent("inventory");
  if (blockComponent != undefined) {
    let toSendData = {
      type: "chestOpen",
      data: {
        block: {
          location: {
            dimension: block.dimension.id,
            x: block.location.x,
            y: block.location.y,
            z: block.location.z,
          },
          typeId: block.typeId,
          blockItems: [],
        },
        player: {
          name: "",
          playerItems: [],
        },
      },
    };
    let blockContainer = blockComponent.container;
    let blockItems = [];
    for (let i = 0; i < blockContainer.size; i++) {
      if (blockContainer.getItem(i) != undefined) {
        blockItems[i] = {
          soltId: i,
          typeId: blockContainer.getItem(i).typeId,
          amount: blockContainer.getItem(i).amount,
        };
      }
    }
    toSendData.data.block.blockItems = blockItems as never[];
    let player = v.source as Player;
    if (player != undefined) {
      toSendData.data.player.name = player.name;
      let playerInventory = player.getComponent("inventory") as EntityInventoryComponent;
      if (playerInventory != undefined) {
        let playerContainer = playerInventory.container;
        let playerItems = [];
        for (let i = 0; i < playerContainer.size; i++) {
          if (playerContainer.getItem(i) != undefined) {
            playerItems[i] = {
              soltId: i,
              typeId: playerContainer.getItem(i).typeId,
              amount: playerContainer.getItem(i).amount,
            };
          }
        }
        toSendData.data.player.playerItems = playerItems as never[];
      }
      sendBehaviorData(toSendData);
    }
  } else {
    let toSendData = {
      type: "blockUse",
      data: {
        block: {
          location: {
            dimension: block.dimension.id,
            x: block.location.x,
            y: block.location.y,
            z: block.location.z,
          },
          typeId: block.type.id,
        },
        player: {
          name: (v.source as Player).name,
        },
      },
    };
    sendBehaviorData(toSendData);
  }
});

world.events.blockBreak.subscribe(async (v) => {
  let toSendData = {
    type: "blockBreak",
    data: {
      block: {
        location: {
          dimension: v.block.dimension.id,
          x: v.block.location.x,
          y: v.block.location.y,
          z: v.block.location.z,
        },
        typeId: v.brokenBlockPermutation.type.id,
      },
      player: {
        name: v.player.name,
      },
    },
  };
  sendBehaviorData(toSendData);
});

world.events.blockPlace.subscribe(async (v) => {
  let toSendData = {
    type: "blockPlace",
    data: {
      block: {
        location: {
          dimension: v.block.dimension.id,
          x: v.block.location.x,
          y: v.block.location.y,
          z: v.block.location.z,
        },
        typeId: v.block.typeId,
      },
      player: {
        name: v.player.name,
      },
    },
  };
  sendBehaviorData(toSendData);
});
