import Service from "@ember/service";
import { later } from "@ember/runloop";
// import { inject as service } from "@ember/service";
import { computed, observer } from "@ember/object";
import EmberObject from "@ember/object";

const ToastMessageObject = EmberObject.extend({
  show: false,
  message: ""
  // showChanged: observer("show", function () {
  //   console.log("changed set to " + this.show);
  // }),
  // messageChanged: observer("message", function () {
  //   console.log("changed set to " + this.message);
  // })
});

export default Service.extend({
  toast: ToastMessageObject.create(),
  showToast(info) {
    this.toast.setProperties("message", {
      message: info,
      show: true
    });
    this.toast.notifyPropertyChange();
    // this.toast.toggleProperty("show", true);
    // this.toast.toggleProperty("message", info);

    // later(() => {
    //   this.toast.setProperties("message", {
    //     message: "",
    //     show: false
    //   });
    // }, 3000);
  }
});
