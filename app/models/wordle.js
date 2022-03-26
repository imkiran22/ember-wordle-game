import Model from "ember-data/model";
import attr from "ember-data/attr";

export default class extends Model {
  position = attr("number");
  totalChances = attr("number");
  currentChance = attr("number");
  attempts = attr("number");
  totalWordsLength = attr("number");
  numberOfColumns = attr("number");
  answer = attr("string");
  freezed = attr("boolean");
  gameOver = attr("boolean");
  freezeRows = attr("json");
  won = attr("boolean");
  info = attr("string");
  error = attr("boolean");
}
