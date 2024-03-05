# MHI SCA Starter Repository
This repository will be your starting point for any SCA project. You MUST clone this repository first before starting ANY SCA development. 

## Contents
* MHI_Extensions
* MHI_Themes
* MHI_Scripts
* .gitignore


## Getting Started
1. First step is to add the ExtensionDevelopmentTools and ThemeDevelopmentTools zip files to the new repo. Log into the Netsuite Instance and go to Installed Bundles.Find the bundle version for SCEM and then go to the File Cabinet and find the correct bundle folder. Download the Extension and Theme Development tools and download them.
2. Place Extension Development tools zip file in the MHI_Extensions folder and unzip. Delete the zip file when complete.
3. Place the Theme Development tools zip file in teh MHI_Themes Extension folder and unzip. Delete the zip file when complete.
4. You can install n node version manager to manage the correct version of node. "npm install -g n"   
2. Verify the node version needed [node version](https://developers.suitecommerce.com/section4183926623)
3. Set the correct node version "n 14.x.x"
4. Run npm install inside both Theme and Extension directories.
5. Run npm install gulp
6. Run gulp command to verify install
7. Create env tokens in Netsuite and insert into the .env file.
8. In the MHI_Extensions folder run "gulp extension:fetch --to" then select all extensions for download
9. In the MHI_Theme folder run "gulp theme:fetch --to" download the correct theme.
10. cd into the Root directory of the project and run "git add ." then run 'git commit -m "initial commit"' then run "git push origin main" or "git push origin master" which ever the branch name is.


## Branches
1. There should be a main or Master branch for production environment
2. There should be a development branch for SBX environment.




