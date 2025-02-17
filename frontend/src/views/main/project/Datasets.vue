<template>
  <div>
    <v-container class="mt-2 mb-0" v-if="isProjectOwnerOrAdmin">
      <div class="d-flex">
        <v-file-input outlined dense counter shrink v-model="fileData" label="Select data (.csv, .xls, .xlsx)" accept=".csv,.xlsx,.xls"></v-file-input>
        <v-btn tile color="primary" class="ml-2" @click="upload_data" :disabled="!fileData">Upload</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="loadDatasets()" color="secondary">Reload<v-icon right>refresh</v-icon></v-btn>
      </div>
    </v-container>
    <v-container v-if="files.length > 0">
      <v-expansion-panels>
        <v-expansion-panel v-for="f in files" :key="f.id">
          <v-expansion-panel-header @click="peakDataFile(f.id)" class="py-1"
            :class="{'file-xl': f.name.indexOf('.xls') > 0, 'file-csv': f.name.indexOf('.csv') > 0}">
            <span class="font-weight-bold" >{{ f.name }}</span>
            <span style="position: absolute; left: 50%">{{ formatSizeForDisplay(f.size) }}</span>
            <span style="position: absolute; left: 60%">{{ new Date(f.creation_date).toLocaleString() }}</span>
            <span style="position: absolute; left: 85%">
              <v-tooltip bottom dense>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon color="info" @click.stop="downloadDataFile(f.id, f.name)" v-bind="attrs" v-on="on">
                    <v-icon>download</v-icon>
                  </v-btn>
                  </template>
                <span>Download</span>
              </v-tooltip>
              <v-tooltip bottom dense>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn icon color="accent" v-if="isProjectOwnerOrAdmin" @click.stop="deleteDataFile(f.id, f.name)" v-bind="attrs" v-on="on">
                    <v-icon>delete</v-icon>
                  </v-btn>
                  </template>
                <span>Delete</span>
              </v-tooltip>
            </span>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-data-table :headers="filePreviewHeader" :items="filePreviewData"
              dense :hide-default-footer="true" 
              v-if="filePreviewHeader.length > 0 && filePreviewData.length > 0">
            </v-data-table>
            <div class="caption" v-else>Could not properly load data</div>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>
    <v-container v-else class="font-weight-light font-italic secondary--text">
      No files uploaded yet.
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { api } from '@/api';
import { dialogDownloadFile, performApiActionWithNotif } from '@/api-commons';
import { readToken } from "@/store/main/getters";
import { formatSizeForDisplay } from '@/utils';
import { commitAddNotification } from '@/store/main/mutations';
import { IProjectFile } from "@/interfaces";

@Component
export default class Datasets extends Vue {
  @Prop({type: Number, required: true}) projectId!: number;
	@Prop({type: Boolean, default: false}) isProjectOwnerOrAdmin!: boolean;

  public files: IProjectFile[] = [];
  public fileData = null;
  public lastVisitedFileId;
  public filePreviewHeader: string[] = [];
  public filePreviewData: any[] = [];

  activated() {
		this.loadDatasets()
	}

	private async loadDatasets() {
		const response = await api.getProjectDatasets(readToken(this.$store), this.projectId)
    this.files = response.data.sort((a, b) => new Date(a.creation_date) < new Date(b.creation_date) ? 1 : -1);
	}
 
  public async upload_data() {
    performApiActionWithNotif(this.$store, 
      () => api.uploadDataFile(readToken(this.$store), this.projectId, this.fileData),
      () => {
        this.loadDatasets()
        this.fileData = null;
      })
  }

  public formatSizeForDisplay = (size: number) => formatSizeForDisplay(size);

  public async deleteDataFile(id: number, fileName: string) {
    if (await this.$dialog.confirm({
      text: `Are you sure you want to delete dataset <strong>${fileName}</strong>?`,
      title: 'Delete dataset'
    })) {
      performApiActionWithNotif(this.$store,
          () => api.deleteDatasetFile(readToken(this.$store), id),
          this.loadDatasets)
    }
	}

  public async downloadDataFile(id: number, fileName: string) {
    try {
      const response = await api.downloadDataFile(readToken(this.$store), id)
			dialogDownloadFile(response, fileName);
		} catch (error) {
      commitAddNotification(this.$store, { content: error.response.statusText, color: 'error' });
		}
	}

  public async peakDataFile(id: number) {
    if (this.lastVisitedFileId != id) { 
      this.lastVisitedFileId = id; // this is a trick to avoid recalling the api every time one panel is opened/closed 
      try {
        const response = await api.peakDataFile(readToken(this.$store), id)
        const headers = JSON.parse(response.data)['schema']['fields']
        this.filePreviewHeader = headers.map(e => {
          return {text: e['name'].trim(), value: e['name'], sortable: false,}
        });
        this.filePreviewData = JSON.parse(response.data)['data']
      } catch (error) {
        commitAddNotification(this.$store, { content: error.response.statusText, color: 'error' });
        this.filePreviewHeader = [];
        this.filePreviewData = [];
      }
    }
  }
}
</script>

<style scoped>
.file-xl {
  border-left: 4px solid #4CAF50
}
.file-csv {
  border-left: 4px solid #03A9F4
}
div.v-input {
  width: 400px;
}
</style>
