<template>
  <v-container fluid>
    <ValidationObserver ref="dataFormObserver" v-slot="{ dirty }">
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <OverlayLoader v-show="loadingData" />
          <v-card-title>
            Input Data
            <v-spacer></v-spacer>
            <v-chip v-show="dirty || isInputNotOriginal" small label outlined color="accent" class="mx-1 pa-1">modified</v-chip>
            <v-btn text small @click="resetInput" :disabled="!(dirty || isInputNotOriginal)">reset</v-btn>
            <v-menu left bottom offset-y :close-on-content-click="false">
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon>settings</v-icon>
                </v-btn>
              </template>
              <v-list dense tile>
                <v-list-item>
                  <v-btn tile small text color="primary" @click="featuresToView = inputMetaData.map(e => e.feat_name)">All</v-btn>
                  <v-btn tile small text color="secondary" @click="featuresToView = []">None</v-btn>
                </v-list-item>
                <v-list-item v-for="f in inputMetaData" :key="f.feat_name" >
                  <v-checkbox
                    :label="f.feat_name" :value="f.feat_name" 
                    v-model="featuresToView"
                    hide-details class="mt-1"
                  ></v-checkbox>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>
          <v-card-text v-if="!errorLoadingMetadata && Object.keys(inputMetaData).length > 0" id="inputTextCard">
            <div class="caption error--text">{{ dataErrorMsg }}</div>
            <v-form lazy-validation>
              <div v-for="c in inputMetaData" :key="c.feat_name"
                v-show="featuresToView.includes(c.feat_name)">
                <ValidationProvider
                  :name="c.feat_name"
                  v-slot="{ dirty }"
                  >
                <div class="py-1 d-flex">
                  <label class="info--text">{{c.feat_name}}
                  </label>
                  <input type="number" v-if="c.feat_type == 'numeric'"
                    v-model="inputData[c.feat_name]"
                    class="common-style-input"
                    :class="{'is-dirty': dirty || inputData[c.feat_name] != originalData[c.feat_name]}"
                    @change="$emit('update:inputData', inputData)"
                    required
                  />
                  <textarea v-if="c.feat_type == 'text'"
                    v-model="inputData[c.feat_name]"
                    :rows="!inputData[c.feat_name] ? 1 : Math.min(15, parseInt(inputData[c.feat_name].length / 40) + 1)"
                    class="common-style-input"
                    :class="{'is-dirty': dirty || inputData[c.feat_name] != originalData[c.feat_name]}"
                    @change="$emit('update:inputData', inputData)"
                    required
                  ></textarea>
                  <select v-if="c.feat_type == 'category'"
                    v-model="inputData[c.feat_name]"
                    class="common-style-input"
                    :class="{'is-dirty': dirty || inputData[c.feat_name] != originalData[c.feat_name]}"
                    @change="$emit('update:inputData', inputData)"
                    required
                  ><option v-for="k in c.feat_cat_values" :key="k" :value="k">{{k}}</option>
                  </select>
                  <FeedbackPopover
                    v-if="!isMiniMode"
                    :inputLabel="c.feat_name"
                    :inputValue="inputData[c.feat_name]"
                    :originalValue="originalData[c.feat_name]"
                    :inputType="c.feat_type"
                    @submit="$emit(dirty ? 'submitVariationFeedback' : 'submitValueFeedback', arguments[0])" 
                    />
                </div>
                </ValidationProvider>
              </div>
            </v-form>
          </v-card-text>

          <v-card-text v-else>
            Could not load metadata. Please try another dataset.
            <p class="error--text">{{errorLoadingMetadata}}</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <PredictionResults :modelId="modelId"
          :targetFeature="targetFeature" 
          :classificationLabels="classificationLabels"
          :predictionTask="predictionTask"
          :inputData="inputData"
          :modified="dirty || isInputNotOriginal"
          @result="setResult"
        />
        <v-card class="mb-4">
          <v-card-title>
            Explanation
          </v-card-title>
          <v-card-text>
          <v-tabs :class="{'no-tab-header': predictionTask != 'classification' || textFeatureNames.length == 0}">
            <v-tab><v-icon left>mdi-align-horizontal-left</v-icon>Global</v-tab>
            <v-tab><v-icon left>text_snippet</v-icon>Text</v-tab>
            <v-tab-item>
              <PredictionExplanations :modelId="modelId"
                :datasetId="datasetId"
                :targetFeature="targetFeature" 
                :classificationLabels="classificationLabels"
                :predictionTask="predictionTask"
                :inputData="inputData"
              />
            </v-tab-item>
            <v-tab-item>
              <TextExplanation :modelId="modelId"
                :datasetId="datasetId"
                :textFeatureNames="textFeatureNames"
                :classificationLabels="classificationLabels"
                :classificationResult="classificationResult"
                :inputData="inputData"
              />
            </v-tab-item>
          </v-tabs>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </ValidationObserver>

  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import OverlayLoader from '@/components/OverlayLoader.vue';
import PredictionResults from './PredictionResults.vue';
import PredictionExplanations from './PredictionExplanations.vue';
import TextExplanation from './TextExplanation.vue';
import { api } from '@/api';
import { readToken } from '@/store/main/getters';
import { IDataMetadata } from '@/interfaces';
import FeedbackPopover from '@/components/FeedbackPopover.vue';

@Component({
  components: { OverlayLoader, PredictionResults, FeedbackPopover, PredictionExplanations, TextExplanation }
})
export default class Inspector extends Vue {
	@Prop({ required: true }) modelId!: number
	@Prop({ required: true }) datasetId!: number
  @Prop({ required: true }) originalData!: object // used for the variation feedback
  @Prop({ required: true }) inputData!: object
  @Prop({ default: false }) isMiniMode!: boolean;
  @Prop() targetFeature!: string

  loadingData = false;
  inputMetaData: IDataMetadata[] = [];
  classificationLabels: string[] = []
  predictionTask = ""
  featuresToView: string[] = []
  errorLoadingMetadata = "" 
  dataErrorMsg = ""
  classificationResult = null

  async mounted() {
    await this.loadMetaData();
  }
  
  @Watch('originalData')
  public resetInput() {
    this.$emit('reset');
    (this.$refs.dataFormObserver as HTMLFormElement).reset();
  }

  @Watch('datasetId')
  @Watch('modelId')
  async loadMetaData() {
    this.loadingData = true;
    try {
      const resp = await api.getFeaturesMetadata(readToken(this.$store), this.modelId, this.datasetId)
      this.inputMetaData = resp.data
      this.featuresToView = this.inputMetaData.map(e => e.feat_name)
      
      const respMetadata = await api.getModelMetadata(readToken(this.$store), this.modelId)
      this.classificationLabels = respMetadata.data.classification_labels
      this.predictionTask = respMetadata.data.prediction_task
      this.errorLoadingMetadata = ""
    } catch (e) {
      this.errorLoadingMetadata = e.response.data.detail
    } finally {
      this.loadingData = false;
    }
  }

  get isInputNotOriginal() { // used in case of opening a feedback where original data and input data passed are different 
    return JSON.stringify(this.inputData) !== JSON.stringify(this.originalData)
  }

  get textFeatureNames() {
    return this.inputMetaData.filter(e => e.feat_type == 'text').map(e => e.feat_name)
  }

  public setResult(r) {
    if (this.predictionTask == "classification") this.classificationResult = r
  }

}
</script>

<style scoped>
label {
  display: inline-block;
  width: 40%;
}
.common-style-input {
  flex-grow: 1;
  border: 1px solid #e4e4e4;
  border-radius: 5px;
  line-height: 24px;
  min-height: 24px;
  width: 56%;
}
select.common-style-input {
  /* -moz-appearance: menulist-button;
  -webkit-appearance: menulist-button; */
  /* OR */
  -moz-appearance: none;
	-webkit-appearance: none;
	appearance: none;
	background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
	background-repeat: no-repeat, repeat;
	background-position: right .3em top 50%, 0 0;
	background-size: .65em auto, 100%;
}
.common-style-input.is-dirty {
  background-color: #AD14572B; /* accent color but with opacity */
}

.v-card__subtitle, .v-card__text, .v-card__title {
  padding-bottom: 8px;
}

>>>.v-tabs.no-tab-header > .v-tabs-bar {
  display: none;
} 

</style>
