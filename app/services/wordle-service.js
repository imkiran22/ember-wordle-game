import Service from "@ember/service";
import { inject as service } from "@ember/service";
import { computed } from "@ember/object";
// import { getOwner } from "@ember/application";
import { Words } from "../constants/wordle-constants";
import { createKeyboard } from "../utils/wordle-utils";
import { later } from "@ember/runloop";

const NO_OF_COLS = 5;
const CHANCES = 6;
const TOTAL_WORDS = NO_OF_COLS * CHANCES;

export default Service.extend({
  store: service(),
  wordsList: [...Words],
  correctAnswer: Words[Math.floor(Math.random() * Words.length)],
  letterPositions: computed({
    get() {
      let obj = {};
      let index = 0;
      for (let char of this.correctAnswer) {
        obj[char] = index;
        index++;
      }
      return obj;
    }
  }),

  _correctAnswersPositions() {
    let obj = Array.from(this.correctAnswer).reduce((acc, curr, index) => {
      acc[curr] = acc[curr] || [];
      acc[curr].push(index);
      return acc;
    }, {});
    return obj;
  },

  wordleMeta: computed({
    get() {
      const obj = this.store.peekRecord("wordle", 1);
      return obj;
    }
  }),

  keyboardMeta: computed({
    get() {
      const obj = this.store.peekRecord("keyboard", 1);
      return obj;
    }
  }),

  _initFreezeRows() {
    let obj = {};
    let index = 0;
    while (index < CHANCES) {
      obj[index.toString()] = false;
      index++;
    }
    return obj;
  },

  createWordleMeta() {
    this.store.createRecord("wordle", {
      id: 1,
      position: 0,
      totalChances: CHANCES,
      currentChance: 1,
      attempts: 1,
      totalWordsLength: TOTAL_WORDS,
      answer: "",
      numberOfColumns: NO_OF_COLS,
      freezed: false,
      gameOver: false,
      freezeRows: this._initFreezeRows(),
      won: false,
      info: "",
      error: false
    });
  },

  createKeyboard() {
    this.store.createRecord("keyboard", { id: 1, alphabets: createKeyboard() });
  },

  checkIfLastPositionInRow() {
    return [4, 9, 14, 19, 24, 29].includes(this.wordleMeta.position - 1);
  },

  //do not perform any more changes
  checkIfCurrentRowIsFreezed() {
    const { freezeRows, position } = this.wordleMeta;
    let pos = position - 1;
    let row = -1;
    if (pos <= 4) {
      row = 0;
    } else if (pos <= 9) {
      row = 1;
    } else if (pos <= 14) {
      row = 2;
    } else if (pos <= 19) {
      row = 3;
    } else if (pos <= 24) {
      row = 4;
    } else if (pos <= 29) {
      row = 5;
    }
    return freezeRows[row];
  },

  _element(position) {
    const element = document.querySelector(
      `.wrapper  div[data-test-id='${position}']`
    );
    return element;
  },

  _addBackgroundClass(index, timer, className) {
    later(
      this,
      () => {
        this._element(index).classList.add(className);
      },
      650 * timer
    );
  },

  _makeAllLettersCorrect(end) {
    let start = end - 5;
    let timer = 0;
    while (start < end) {
      this._addBackgroundClass(start++, timer++, "correct");
    }
    later(
      this,
      () => {
        this.wordleMeta.setProperties({ info: "Impressive" });
      },
      timer * 650
    );
  },

  _findHelper(arr, answer, operator) {
    let helper = (correctLetterAtIndex, answerLetterAtIndex) => {
      if (operator === "equal") {
        return correctLetterAtIndex === answerLetterAtIndex;
      }
      return correctLetterAtIndex !== answerLetterAtIndex;
    };

    for (let n of arr) {
      let correctLetterAtIndex = this.correctAnswer[n];
      let answerLetterAtIndex = answer[n];
      if (helper(correctLetterAtIndex, answerLetterAtIndex)) {
        return n;
      }
    }

    return -1;
  },

  _findFirstNonMatchingIndex(arr, answer) {
    return this._findHelper(arr, answer, "not_equal");
  },

  _findFirstMatchingIndex(arr, answer) {
    return this._findHelper(arr, answer, "equal");
  },

  _removePositionFromArr(arr, pos) {
    let index = arr.indexOf(pos);
    arr.splice(index, 1);
  },

  _addKeyboardClass(key, className, timer) {
    const data = { ...this.keyboardMeta };
    let applyClass = "";

    if (data.alphabets[key] === "correct") return null;

    if (["correct", "present"].includes(className)) {
      applyClass = className;
    } else {
      if (data.alphabets[key] === "present") {
        return null;
      }
      applyClass = className;
    }
    const alphabets = { ...data.alphabets, [key]: applyClass };
    this.keyboardMeta.set("alphabets", alphabets);
  },

  _checkPositionLetters(answer, start) {
    let timer = 0;
    let keyboardTimer = 0;
    let obj = this._correctAnswersPositions();
    let letterIndex = 0;

    for (let letter of answer) {
      let arr = obj[letter] || [];
      if (arr.length) {
        const index = this._findFirstNonMatchingIndex(arr, answer);
        const isWordCorrectAtBothPositions =
          this.correctAnswer[letterIndex] === answer[letterIndex];
        if (index > -1) {
          const className = isWordCorrectAtBothPositions
            ? "correct"
            : "present";
          this._addBackgroundClass(start++, timer++, className);
          this._removePositionFromArr(arr, index);
          later(
            this,
            () => {
              this._addKeyboardClass(letter, className);
            },
            keyboardTimer++ * 650
          );
        } else {
          const index = this._findFirstMatchingIndex(arr, answer);
          if (index === -1) {
            this._addBackgroundClass(start++, timer++, "invalid");
            later(
              this,
              () => {
                this._addKeyboardClass(letter, "invalid");
              },
              keyboardTimer++ * 650
            );
          } else {
            if (isWordCorrectAtBothPositions) {
              this._addBackgroundClass(start++, timer++, "correct");
              later(
                this,
                () => {
                  this._addKeyboardClass(letter, "correct");
                },
                keyboardTimer++ * 650
              );

              this._removePositionFromArr(arr, index);
            } else {
              this._addBackgroundClass(start++, timer++, "invalid");
              later(
                this,
                () => {
                  this._addKeyboardClass(letter, "invalid");
                },
                keyboardTimer++ * 650
              );
            }
          }
        }
      } else {
        this._addBackgroundClass(start++, timer++, "invalid");
        later(
          this,
          () => {
            this._addKeyboardClass(letter, "invalid");
          },
          keyboardTimer++ * 650
        );
      }
      letterIndex++;
    }
  },

  _correctKeyboard(answer) {
    let timer = 0;
    for (let char of answer) {
      this._addKeyboardClass(char, "correct", timer++);
    }
  },

  _checkAnswer() {
    let {
      position,
      attempts,
      currentChance,
      totalChances,
      freezeRows
    } = this.wordleMeta;
    let startIndex = position - 5;
    let answer = "";

    while (startIndex < position) {
      answer += this._element(startIndex).textContent.trim();
      startIndex++;
    }

    if (this.correctAnswer === answer) {
      this.wordleMeta.setProperties({
        freezed: true,
        gameOver: true,
        won: true
      });
      this._makeAllLettersCorrect(startIndex);
      this._correctKeyboard(answer);
    } else if (this.wordsList.includes(answer)) {
      // answer is wrong but a valid word - move to next position
      let freezeRowsClone = { ...freezeRows };
      freezeRowsClone[currentChance - 1] = true;
      this.wordleMeta.setProperties({
        freezed: false,
        currentChance: currentChance + 1,
        freezeRows: freezeRowsClone
      });
      // show correct present letters
      this._checkPositionLetters(answer, startIndex - 5);
      // if last combination is wrong increase the total chance
      currentChance = currentChance + 1;
      this.wordleMeta.set("currentChance", currentChance);
    } else {
      this.wordleMeta.set("error", true);
      later(
        this,
        () => {
          this.wordleMeta.set("error", false);
        },
        1000
      );
    }

    this.wordleMeta.set("attempts", attempts + 1);
    if (currentChance > totalChances && !this.wordleMeta.won) {
      this.wordleMeta.setProperties({
        freezed: true,
        gameOver: true,
        won: false,
        info: `Answer is ${this.correctAnswer}`
      });
    }
  },

  _removeCurrentLetter() {
    const { position } = this.wordleMeta;
    const pos = position - 1;
    this._element(pos).textContent = "";
    this.wordleMeta.setProperties({ position: pos, freezed: false });
  }
});
