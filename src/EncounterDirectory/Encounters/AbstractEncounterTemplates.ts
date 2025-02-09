import { AbstractEncounter, ALIGNMENT, DIFFICULTY, LEVEL_REPRESENTATION, PRIORITY } from "../Encounter"

const SevereBossAndLackeys: AbstractEncounter = {
    id: 'encounter-001',
    name: 'Severe Boss and Lackeys',
    difficulty: DIFFICULTY.Severe,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Boss',
            level: '+2',
            side: ALIGNMENT.Opponents,
            count: 1,
            tiePriority: PRIORITY.NPC,
        },
        {
            name: 'Lackey',
            level: '-4',
            side: ALIGNMENT.Opponents,
            count: 4,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Elite Boss',
                    level: '+3',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Lackey',
                    level: '-4',
                    side: ALIGNMENT.Opponents,
                    count: 3,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Elite Boss',
                    level: '+3',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Elite Lackey',
                    level: '-3',
                    side: ALIGNMENT.Opponents,
                    count: 4,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
const SevereBossAndLieutenant: AbstractEncounter = {
    id: 'encounter-002',
    name: 'Severe Boss and Lieutenant',
    difficulty: DIFFICULTY.Severe,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Boss',
            level: '+2',
            side: ALIGNMENT.Opponents,
            count: 1,
            tiePriority: PRIORITY.NPC,
        },
        {
            name: 'Lieutenant',
            level: '+0',
            side: ALIGNMENT.Opponents,
            count: 1,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Elite Boss',
                    level: '+3',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Weak Lieutenant',
                    level: '-1',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Elite Boss',
                    level: '+3',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Elite Lieutenant',
                    level: '+1',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
const SevereWorthyOponents: AbstractEncounter = {
    id: 'encounter-003',
    name: 'Severe Worthy Opponents',
    difficulty: DIFFICULTY.Severe,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Opponent',
            level: '+0',
            side: ALIGNMENT.Opponents,
            count: 3,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Opponent',
                    level: '+0',
                    side: ALIGNMENT.Opponents,
                    count: 3,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Weak Opponent',
                    level: '-1',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Opponent',
                    level: '+0',
                    side: ALIGNMENT.Opponents,
                    count: 3,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Weak Opponent',
                    level: '-1',
                    side: ALIGNMENT.Opponents,
                    count: 2,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
const ModerateLieutenantAndLackeys: AbstractEncounter = {
    id: 'encounter-004',
    name: 'Moderate Lieutenant and Lackeys',
    difficulty: DIFFICULTY.Moderate,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Lieutenant',
            level: '+0',
            side: ALIGNMENT.Opponents,
            count: 1,
            tiePriority: PRIORITY.NPC,
        },
        {
            name: 'Lackey',
            level: '-4',
            side: ALIGNMENT.Opponents,
            count: 4,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Elite Lieutenant',
                    level: '+1',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Weak Lackey',
                    level: '-4',
                    side: ALIGNMENT.Opponents,
                    count: 4,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Elite Lieutenant',
                    level: '+1',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Elite Lackey',
                    level: '-3',
                    side: ALIGNMENT.Opponents,
                    count: 4,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
const ModerateMatedPair: AbstractEncounter = {
    id: 'encounter-005',
    name: 'Moderate Mated Pair',
    difficulty: DIFFICULTY.Moderate,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Mated Opponent',
            level: '+0',
            side: ALIGNMENT.Opponents,
            count: 2,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Mated Opponent',
                    level: '+0',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Elite Mated Opponent',
                    level: '+1',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Elite Mated Opponent',
                    level: '+1',
                    side: ALIGNMENT.Opponents,
                    count: 2,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
const ModerateTroop: AbstractEncounter = {
    id: 'encounter-006',
    name: 'Moderate Troop',
    difficulty: DIFFICULTY.Moderate,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Leader',
            level: '+0',
            side: ALIGNMENT.Opponents,
            count: 1,
            tiePriority: PRIORITY.NPC,
        },
        {
            name: 'Troop',
            level: '-2',
            side: ALIGNMENT.Opponents,
            count: 2,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Leader',
                    level: '+0',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Troop',
                    level: '-2',
                    side: ALIGNMENT.Opponents,
                    count: 3,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Elite Leader',
                    level: '+1',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Troop',
                    level: '-2',
                    side: ALIGNMENT.Opponents,
                    count: 3,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
const LowMookSquad: AbstractEncounter = {
    id: 'encounter-007',
    name: 'Low Mook Squad',
    difficulty: DIFFICULTY.Low,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Mook',
            level: '-4',
            side: ALIGNMENT.Opponents,
            count: 6,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Mook',
                    level: '-4',
                    side: ALIGNMENT.Opponents,
                    count: 2,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Elite Mook',
                    level: '-3',
                    side: ALIGNMENT.Opponents,
                    count: 4,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Mook',
                    level: '-4',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Elite Mook',
                    level: '-3',
                    side: ALIGNMENT.Opponents,
                    count: 6,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
const ExtremeSoloBoss: AbstractEncounter = {
    id: 'encounter-008',
    name: 'Extreme Solo Boss',
    difficulty: DIFFICULTY.Extreme,
    partySize: 4,
    levelRepresentation: LEVEL_REPRESENTATION.Relative,
    participants: [
        {
            name: 'Boss',
            level: '+4',
            side: ALIGNMENT.Opponents,
            count: 1,
            tiePriority: PRIORITY.NPC,
        },
    ],
    variants: [
        {
            partySize: 5,
            externalConditions: 'Party size 5',
            participants: [
                {
                    name: 'Boss',
                    level: '+4',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Troop',
                    level: '-2',
                    side: ALIGNMENT.Opponents,
                    count: 2,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },{
            partySize: 6,
            externalConditions: 'Party size 6',
            participants: [
                {
                    name: 'Weak Boss',
                    level: '+3',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
                {
                    name: 'Weak Boss Companion',
                    level: '+3',
                    side: ALIGNMENT.Opponents,
                    count: 1,
                    tiePriority: PRIORITY.NPC,
                },
            ],
        },
    ],
}
export default [
    SevereBossAndLackeys,
    SevereBossAndLieutenant,
    SevereWorthyOponents,
    ModerateLieutenantAndLackeys,
    ModerateMatedPair,
    ModerateTroop,
    LowMookSquad,
    ExtremeSoloBoss,
]
/*
### **Severe Boss and Lackeys**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -4     | 4 (40)         | 3 (30)         |                |
| Party Level -3     |                |                | 4 (60)         |
| Party Level +2     | 1 (80)         |                |                |
| Party Level +3     |                | 1 (120)        | 1 (120)        |
### **Severe Boss and Lieutenant**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -1     |                | 1 (30)         |                |
| Party Level        | 1 (40)         |                |                |
| Party Level +1     |                |                | 1 (60)         |
| Party Level +2     | 1 (80)         |                |                |
| Party Level +3     |                | 1 (120)        | 1 (120)        |
### **Severe Elite Enemies
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -1     |                | 1 (30)         | 2 (60)         |
| Party Level        | 3 (120)        | 3 (120)        | 3 (120)        |
### **Moderate Lieutenant and Lackeys**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -4     | 4 (40)         | 4 (40)         |                |
| Party Level -3     |                |                | 4 (60)         |
| Party Level -2     |                |                |                |
| Party Level -1     |                |                |                |
| Party Level        | 1 (40)         |                |                |
| Party Level +1     |                | 1 (60)         | 1 (60)         |
## **Moderate Mated Pair**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level        | 2 (80)         | 1 (40)         |                |
| Party Level +1     |                | 1 (60)         | 2 (120)        |
## **Moderate Troop**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -2     | 2 (40)         | 3 (60)         | 3 (60)         |
| Party Level -1     |                |                |                |
| Party Level        | 1 (40)         | 1 (40)         |                |
| Party Level +1     |                |                | 1 (60)         |
## **Low Mook Squad**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -4     | 6 (60)         | 2 (20)         | 1 (10)         |
| Party Level -3     |                | 4 (60)         | 6 (90)         |
## **Extreme Solo Boss**
| **Creature Level** | Party size (4) | Party size (5) | Party size (6) |
| ------------------ | -------------- | -------------- | -------------- |
| Party Level -2     |                | 2 (40)         |                |
| Party Level -1     |                |                |                |
| Party Level        |                |                |                |
| Party Level +1     |                |                |                |
| Party Level +2     |                |                |                |
| Party Level +3     |                |                | 2 (240)        |
| Party Level +4     | 1 (160)        | 1 (160)        |                |
*/