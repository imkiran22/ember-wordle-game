import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { computed, observer } from "@ember/object";
import { isPresent } from "@ember/utils";

export default class extends Component {
  @service toasterService;
  @computed("toasterService.toast")
  get show() {
    return this.toasterService.toast.show;
  }

  constructor() {
    super(...arguments);
    this.toasterService.toast.addObserver("showChanged", (...args) => {
      console.log("CHANGE");
    });
  }
}
