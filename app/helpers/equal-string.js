import { helper } from "@ember/component/helper";

export default helper(function equalString(params) {
  const [a, b] = params;
  return a.toLowerCase() === b.toLowerCase();
});
