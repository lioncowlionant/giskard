import Vue from 'vue';
import Vuex, {StoreOptions} from 'vuex';

import {mainModule} from './main';
import {State} from './state';
import {adminModule} from './admin';
import vuetify from '@/plugins/vuetify'

import VuetifyDialog from 'vuetify-dialog'

Vue.use(Vuex);
Vue.use(VuetifyDialog, {
  context: {
    vuetify
  }
});

const storeOptions: StoreOptions<State> = {
  modules: {
    main: mainModule,
    admin: adminModule,
  },
};

export const store = new Vuex.Store<State>(storeOptions);

export default store;
