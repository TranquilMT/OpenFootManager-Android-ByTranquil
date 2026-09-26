import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
function readBaseVersion():string{const configPath=fileURLToPath(new URL("./src-tauri/tauri.conf.json",import.meta.url));const config=JSON.parse(readFileSync(configPath,"utf8")) as {version?:string};return config.version??"0.0.0";}
function readCommitSha():string{// @ts-expect-error process is a nodejs global
 const ciSha:string|undefined=process.env.GITHUB_SHA;if(ciSha)return ciSha.slice(0,7);try{return execFileSync("git",["rev-parse","--short=7","HEAD"],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim();}catch{return "unknown";}}
function readBuildNumber():string{// @ts-expect-error process is a nodejs global
 const explicit:string|undefined=process.env.VITE_APP_BUILD_NUMBER??process.env.GITHUB_RUN_NUMBER;return explicit&&/^\d+$/.test(explicit.trim())?explicit.trim():"";}
function defaultChannel(version:string):string{const minor=Number.parseInt(version.split(".")[1]??"",10);if(!Number.isFinite(minor))return"dev";return minor%2===1?"nightly":"stable";}
function resolveChannel(version:string,isBuild:boolean):string{// @ts-expect-error process is a nodejs global
 const explicit:string|undefined=process.env.OFM_CHANNEL;if(explicit)return explicit;return isBuild?defaultChannel(version):"dev";}
function normalizeModuleId(id:string):string{return id.replaceAll("\\","/");} function isNodeModulePackage(id:string,packageName:string):boolean{const n=normalizeModuleId(id),p=`/node_modules/${packageName}`;return n.includes(`${p}/`)||n.endsWith(p);} function matchesAnyPackage(id:string,names:string[]):boolean{return names.some(n=>isNodeModulePackage(id,n));} function isAppModule(id:string,path:string):boolean{return normalizeModuleId(id).endsWith(path);} function matchesAnyAppModule(id:string,paths:string[]):boolean{return paths.some(p=>isAppModule(id,p));}
function manualChunks(id:string):string|undefined{if(matchesAnyAppModule(id,["/src/lib/countries.ts"]))return"countries";if(id.indexOf("node_modules")===-1)return undefined;if(matchesAnyPackage(id,["i18n-iso-countries"]))return"countries";if(matchesAnyPackage(id,["react-router","react-router-dom"]))return"router";if(matchesAnyPackage(id,["i18next","react-i18next","i18next-resources-to-backend"]))return"i18n";if(isNodeModulePackage(id,"lucide-react"))return"icons";if(matchesAnyPackage(id,["@tauri-apps/api","@tauri-apps/plugin-opener"]))return"tauri";if(matchesAnyPackage(id,["react","react-dom","scheduler"]))return"react-vendor";return undefined;}
export default defineConfig(async({command})=>({plugins:[react(),tailwindcss()],define:(()=>{const version=readBaseVersion();return{__APP_VERSION__:JSON.stringify(version),__APP_CHANNEL__:JSON.stringify(resolveChannel(version,command==="build")),__APP_COMMIT__:JSON.stringify(readCommitSha()),__APP_BUILD_DATE__:JSON.stringify(new Date().toISOString().slice(0,10)),__APP_BUILD_NUMBER__:JSON.stringify(readBuildNumber())};})(),test:{environment:"jsdom",globals:true,include:["src/**/*.test.{ts,tsx}"],setupFiles:["src/test-setup.ts"],coverage:{exclude:["src/i18n/locales/**","src/**/*.test.{ts,tsx}","src/test-setup.ts"]}},clearScreen:false,build:{rollupOptions:{output:{manualChunks}}},server:{port:1420,strictPort:true,host:host||false,hmr:host?{protocol:"ws",host,port:1421}:undefined,watch:{ignored:["**/src-tauri/**"]}}}));
