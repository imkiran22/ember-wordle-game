import Controller from "@ember/controller";
import { computed, action } from "@ember/object";
import { throttle } from "@ember/runloop";
import { tracked } from "@glimmer/tracking";
import { inject as service } from "@ember/service";
import { getOwner } from "@ember/application";

export default class ApplicationController extends Controller {
  @service store;
  @service wordleService;
  // @service toasterService;
  appName = "Wordle Game";
  constructor() {
    super(...arguments);
    this.wordleService.createWordleMeta();
    this.wordleService.createKeyboard();
    this.setThemeBasedOnDevice();
  }

  setThemeBasedOnDevice() {
    let mode = "light-mode";
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      mode = "dark-mode";
    }
    document.body.classList.add(mode);
  }
}
