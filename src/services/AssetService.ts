import { SearchResult } from '../store';
import { Endpoints, FlowEditorConfig } from '../flowTypes';
import axios, { AxiosResponse } from 'axios';
import { FlowComponents } from '../store/helpers';

export interface GroupAsset {
    uuid: string;
    name: string;
}

export class Assets {
    private items: SearchResult[] = [];
    private endpoint: string;
    private localStorage: boolean;

    constructor(endpoint: string, localStorage: boolean) {
        this.localStorage = localStorage;
        this.endpoint = endpoint;
    }

    public search(term: string): Promise<SearchResult[]> {
        let matches: SearchResult[] = [];

        // if we have local storage, search there
        if (this.localStorage) {
            matches = this.items.filter((result: SearchResult) => this.matches(term, result.name));
        }

        // then query against our endpoint to add to that list
        return axios
            .get(this.endpoint + '?query=' + encodeURIComponent(term))
            .then((response: AxiosResponse) => {
                for (const result of response.data.results) {
                    if (this.matches(term, result.name)) {
                        matches.push({ name: result.name, id: result.uuid });
                    }
                }
                return matches;
            });
    }

    public matches(query: string, check: string): boolean {
        return (
            check
                .toLocaleLowerCase()
                .trim()
                .indexOf(query.toLocaleLowerCase().trim()) > -1
        );
    }

    public add(result: SearchResult): void {
        if (this.localStorage) {
            const exists = this.items.filter((existing: SearchResult) =>
                this.matches(existing.name, result.name)
            );

            if (exists.length === 0) {
                this.items.push(result);
            }
        }
    }

    public addAll(results: SearchResult[]): void {
        results.map((result: SearchResult) => {
            this.add(result);
        });
    }
}

export default class AssetService {
    private groups: Assets;
    constructor(config: FlowEditorConfig) {
        this.groups = new Assets(config.endpoints.groups, config.localStorage);
    }

    public addFlowComponents(flowComponents: FlowComponents): void {
        this.groups.addAll(flowComponents.groups);
    }

    public getGroupAssets(): Assets {
        return this.groups;
    }
}
