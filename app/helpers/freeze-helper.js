import { helper } from "@ember/component/helper";

export default helper(function freezeHelper(params /*, hash*/) {
  const [rows, index] = params;
  return rows[index];
});
