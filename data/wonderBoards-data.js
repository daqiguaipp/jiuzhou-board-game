window.JIUZHOU_BOARDS = [
  {
    "id": "guanzhong",
    "name": "关中",
    "subtitle": "秦汉故地",
    "startResource": {
      "石料": 1
    },
    "ability": "第一、第二时代武备结算后，每战胜 1 方邻国，选择粮食、木材、石料、铁矿中的一种，获得 1 张对应的基础资源牌并加入资源卡槽；可以重复选择。第三时代不触发。",
    "stages": [
      {
        "name": "函谷锁钥",
        "cost": {
          "粮食": 1,
          "石料": 1
        },
        "effects": {
          "points": 3
        }
      },
      {
        "name": "长安市井",
        "cost": {
          "石料": 2,
          "布匹": 1
        },
        "effects": {
          "points": 6
        }
      },
      {
        "name": "未央宫阙",
        "cost": {
          "石料": 3,
          "简帛": 1
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "qilu",
    "name": "齐鲁",
    "subtitle": "礼乐儒风",
    "startResource": {
      "简帛": 1
    },
    "ability": "每集齐一套“经学 + 工学 + 史学”，额外获得 2 分。",
    "stages": [
      {
        "name": "稷下讲坛",
        "cost": {
          "简帛": 1,
          "陶器": 1
        },
        "effects": {
          "points": 3
        }
      },
      {
        "name": "曲阜礼制",
        "cost": {
          "简帛": 2,
          "粮食": 1
        },
        "effects": {
          "effect": "chooseScienceAtEnd"
        }
      },
      {
        "name": "海岱会盟",
        "cost": {
          "简帛": 2,
          "布匹": 2
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "jiangnan",
    "name": "江南",
    "subtitle": "水网粮仓",
    "startResource": {
      "粮食": 1
    },
    "ability": "每完成 1 个区域阶段，获得 1 文明分和 2 铜钱；邻国武备必须至少比你高 2 点，才算战胜你。",
    "stages": [
      {
        "name": "鱼米水渠",
        "cost": {
          "粮食": 2
        },
        "effects": {
          "wildBasicResource": 1
        }
      },
      {
        "name": "吴越工坊",
        "cost": {
          "粮食": 2,
          "陶器": 1
        },
        "effects": {
          "points": 6
        }
      },
      {
        "name": "江南文脉",
        "cost": {
          "粮食": 2,
          "简帛": 2
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "bashu",
    "name": "巴蜀",
    "subtitle": "天府栈道",
    "startResource": {
      "木材": 1
    },
    "ability": "巴蜀技能：游戏结束时，铜钱按每 2 枚 = 1 分计算；邻国武备必须至少比你高 2 点，才算战胜你。",
    "stages": [
      {
        "name": "都江堰",
        "cost": {
          "陶器": 1,
          "木材": 1
        },
        "effects": {
          "points": 3
        }
      },
      {
        "name": "蜀道商旅",
        "cost": {
          "陶器": 2,
          "布匹": 1
        },
        "effects": {
          "coins": 6,
          "effect": "extraCoinsFirstGainEachTurn"
        }
      },
      {
        "name": "锦官繁华",
        "cost": {
          "陶器": 2,
          "简帛": 2
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "heluo",
    "name": "河洛",
    "subtitle": "王畿中原",
    "startResource": {
      "陶器": 1
    },
    "ability": "游戏结束时，每张已建蓝牌额外获得 1 分，不设上限。",
    "stages": [
      {
        "name": "洛水舟桥",
        "cost": {
          "陶器": 1,
          "木材": 1
        },
        "effects": {
          "points": 3
        }
      },
      {
        "name": "王畿营造",
        "cost": {
          "石料": 2,
          "陶器": 1
        },
        "effects": {
          "effect": "useSeventhCard"
        }
      },
      {
        "name": "九鼎礼器",
        "cost": {
          "陶器": 2,
          "简帛": 2
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "yanzhao",
    "name": "燕赵",
    "subtitle": "边塞慷慨",
    "startResource": {
      "铁矿": 1
    },
    "ability": "战争结算时：若战胜 1 方邻国，额外获得 1 分、1 铜钱；若左右两方都战胜，总共额外获得 3 分、3 铜钱。",
    "stages": [
      {
        "name": "易水烽火",
        "cost": {
          "铁矿": 1,
          "粮食": 1
        },
        "effects": {
          "military": 1
        }
      },
      {
        "name": "燕山铁骑",
        "cost": {
          "铁矿": 2,
          "木材": 1
        },
        "effects": {
          "military": 3
        }
      },
      {
        "name": "蓟城雄关",
        "cost": {
          "铁矿": 3,
          "陶器": 1
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "lingnan",
    "name": "岭南",
    "subtitle": "海贸百越",
    "startResource": {
      "布匹": 1
    },
    "ability": "建造黄牌时，立即获得 2 铜钱。游戏结束时，每张已建黄牌额外获得 1 分；邻国武备必须至少比你高 2 点，才算战胜你。",
    "stages": [
      {
        "name": "南海市舶",
        "cost": {
          "布匹": 1,
          "粮食": 1
        },
        "effects": {
          "effect": "openOverseasTradeRoute"
        }
      },
      {
        "name": "越岭通道",
        "cost": {
          "布匹": 2,
          "木材": 1
        },
        "effects": {
          "coins": 9
        }
      },
      {
        "name": "珠崖远航",
        "cost": {
          "布匹": 3,
          "简帛": 1
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "mobei",
    "name": "漠北",
    "subtitle": "草原铁骑",
    "startResource": {
      "粮食": 1
    },
    "ability": "时代末武备结算时，每战胜 1 方邻国，夺取该邻国当前铜钱数的一半，向下取整，最多夺取 5 枚；若该邻国至少有 1 枚铜钱，则至少夺取 1 枚。若左右两方都战胜，分别结算。",
    "stages": [
      {
        "name": "阴山牧场",
        "cost": {
          "粮食": 1,
          "铁矿": 1
        },
        "effects": {
          "military": 1
        }
      },
      {
        "name": "龙城牙帐",
        "cost": {
          "粮食": 2,
          "布匹": 1
        },
        "effects": {
          "points": 6
        }
      },
      {
        "name": "瀚海王庭",
        "cost": {
          "粮食": 3,
          "简帛": 1
        },
        "effects": {
          "points": 9
        }
      }
    ]
  },
  {
    "id": "hexi",
    "name": "河西",
    "subtitle": "丝路咽喉",
    "startResource": {
      "布匹": 1
    },
    "ability": "支付建造卡牌或建设区域成本时，你自己拥有的陶器、简帛、布匹可以互相视为任意一种高级资源；从邻国购买来的资源不能因此转换。",
    "stages": [
      {
        "name": "玉门关市",
        "cost": {
          "布匹": 1,
          "石料": 1
        },
        "effects": {
          "points": 3
        }
      },
      {
        "name": "敦煌宝市",
        "cost": {
          "布匹": 2,
          "陶器": 1
        },
        "effects": {
          "coins": 6,
          "points": 3
        }
      },
      {
        "name": "安西都护",
        "cost": {
          "布匹": 3,
          "简帛": 1
        },
        "effects": {
          "points": 9
        }
      }
    ]
  }
];
