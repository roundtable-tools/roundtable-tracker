import { LevelDifference } from "./LevelDifference";

export class Level extends Number {
    levelDifference(baseLevel: Level): LevelDifference {
        return new LevelDifference(this.valueOf() - baseLevel.valueOf());
    }
}