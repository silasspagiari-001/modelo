Ext.define('SamosAdminModern.parent.ViewController', {
    extend: 'Ext.app.ViewController',

    doDefaultFocus: function () {
        setTimeout(() => {
            const view = this.getView();
            const test = view.getDefaultFocus();
            const defaultFocus = this.getView().query(test)[0];
            
            if (defaultFocus) {
                defaultFocus.focus(); 
            }
        }, 500);
    }
});
