import { LevelDifference } from "./LevelDifference";

export class Level extends Number {
    levelDifference(baseLevel: Level): LevelDifference {
        return new LevelDifference(this.valueOf() - baseLevel.valueOf());
    }
    static get NegativeOne(): Level {
        return new Level(-1);
    }
    static get Zero(): Level {
        return new Level(0);
    }
    static get One(): Level {
        return new Level(1);
    }
    static get Two(): Level {
        return new Level(2);
    }
    static get Three(): Level {
        return new Level(3);
    }
    static get Four(): Level {
        return new Level(4);
    }
    static get Five(): Level {
        return new Level(5);
    }
    static get Six(): Level {
        return new Level(6);
    }
    static get Seven(): Level {
        return new Level(7);
    }
    static get Eight(): Level {
        return new Level(8);
    }
    static get Nine(): Level {
        return new Level(9);
    }
    static get Ten(): Level {
        return new Level(10);
    }
    static get Eleven(): Level {
        return new Level(11);
    }
    static get Twelve(): Level {
        return new Level(12);
    }
    static get Thirteen(): Level {
        return new Level(13);
    }
    static get Fourteen(): Level {
        return new Level(14);
    }
    static get Fifteen(): Level {
        return new Level(15);
    }
    static get Sixteen(): Level {
        return new Level(16);
    }
    static get Seventeen(): Level {
        return new Level(17);
    }
    static get Eighteen(): Level {
        return new Level(18);
    }
    static get Nineteen(): Level {
        return new Level(19);
    }
    static get Twenty(): Level {
        return new Level(20);
    }
    static get TwentyOne(): Level {
        return new Level(21);
    }
    static get TwentyTwo(): Level {
        return new Level(22);
    }
    static get TwentyThree(): Level {
        return new Level(23);
    }
    static get TwentyFour(): Level {
        return new Level(24);
    }
}