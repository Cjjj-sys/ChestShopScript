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
} from "@minecraft/server";
import { http, HttpClient, HttpHeader, HttpRequest, HttpResponse, HttpRequestMethod } from "@minecraft/server-net";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const toSendHttpUrl = "http://115.227.16.166:19144";

function sendBehaviorData(data: any) {
  let request = new HttpRequest(toSendHttpUrl);
  request.method = HttpRequestMethod.POST;
  request.addHeader("content-type", "application/json");
  request.body = JSON.stringify(data);
  http
    .request(request)
    .then((response) => {})
    .catch((error) => {});
}

world.events.itemStartUseOn.subscribe(async (v) => {
  let location = v.blockLocation;
  let block = world.getDimension("overworld").getBlock(location);
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
