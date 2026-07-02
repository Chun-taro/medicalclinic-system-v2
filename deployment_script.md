# Video Script: BukSU Med Clinic Deployment (Docker Workflow)

**Total Estimated Duration:** 5–7 Minutes  
**Target URL:** http://167.172.73.9/buksumedclinic  
**Credentials:** BukSUMedClinic@123

---

## Part 1: Login & Server Access (0:00 – 1:00)

**[Visual: Desktop view. Open Terminal/PowerShell.]**

*   **Narration:** "Hello. In this video, we will demonstrate the deployment of the BukSU Med Clinic system to our production server using Docker. We'll be following the standard student deployment workflow."
*   **Narration:** "First, we establish a secure connection to the server. I'll use SSH to log in with my assigned credentials at the IP address 167.172.73.9."
*   **[Visual: Type `ssh your_username@167.172.73.9` and enter password.]**
*   **Narration:** "Now that we're logged in, let's navigate to our project directory: `cd ~/project`. This is where our application files will reside."

---

## Part 2: Project Upload & Structure (1:00 – 2:00)

**[Visual: Show WinSCP or an SCP command in progress.]**

*   **Narration:** "The next step is uploading our project files. You can use WinSCP for a graphical interface or the SCP command for a direct transfer. We ensure our project follows the required structure: a `frontend` folder, a `backend` folder, and our `docker-compose.yml` file in the root."
*   **[Visual: Type `ls -F` in the terminal to show the folder structure.]**
*   **Narration:** "As you can see, our directories are organized and ready for the Docker build process."

---

## Part 3: Configuration (Docker & Vite) (2:00 – 3:30)

**[Visual: Open `docker-compose.yml` in the terminal using `cat` or `nano`.]** 

*   **Narration:** "Configuration is key for path-based deployment. In our `docker-compose.yml`, we've mapped our assigned port—port 3001—to the container's internal port to ensure it's accessible via the server's reverse proxy."
*   **Narration:** "Equally important is our frontend configuration. In the Vite settings, we've set the `base` path to `/buksumedclinic/`. This ensures that all assets like scripts and images load correctly when accessed through the sub-directory URL."
*   **[Visual: Briefly show `frontend/vite.config.js` highlighting the `base: "/buksumedclinic/"` line.]**

---

## Part 4: Building & Running (3:30 – 4:30)

**[Visual: In the server terminal, type `docker compose up -d --build`.]**

*   **Narration:** "Now, let's launch the application. We run `docker-compose up -d --build`. This command builds our images from the Dockerfiles and starts the containers in detached mode."
*   **Narration:** "This might take a minute as it installs dependencies and compiles the React frontend. Once finished, we verify the status by running `docker ps` to ensure our containers are healthy and running on the correct port."
*   **[Visual: Show `docker ps` output showing the containers.]**

---

## Part 5: Access & Verification (4:30 – 6:00)

**[Visual: Switch to Browser. Navigate to `http://167.172.73.9/buksumedclinic`.]**

*   **Narration:** "With the containers running, let's access the application via the browser at `http://167.172.73.9/buksumedclinic`."
*   **Narration:** "The login page loads perfectly. We'll now log in using our credentials: `BukSUMedClinic@123`."
*   **[Visual: Log in and show the Admin Dashboard. Click on 'All Appointments' to show the cleaned-up interface and capitalized patient categories.]**
*   **Narration:** "The deployment is successful. All features, including the medical certificates and reports, are fully operational in this Dockerized environment."

---

## Part 6: Cleanup & Conclusion (6:00 – End)

**[Visual: Back to terminal. Type `docker compose down`.]**

*   **Narration:** "To conclude, we've successfully moved our BukSU Med Clinic system from local development to the production server. As per the workflow rules, once we've finished our testing and recording, we stop the application using `docker compose down` to free up server resources."
*   **Narration:** "Thank you for following along with this deployment guide."

---

### **Student Workflow Checklist for Recording:**
1.  **SSH Login**: Show the terminal connection.
2.  **Directory**: Show `cd ~/project` and `ls`.
3.  **Docker Build**: Show the `docker compose up` command.
4.  **Browser Access**: Show the URL clearly in the address bar.
5.  **Functionality**: Show a quick login and one major feature (Dashboard).
6.  **Shutdown**: Show `docker compose down` at the very end.

---

## Quick Command Script (Cheat Sheet)

Here is a clear and easy-to-follow script of the exact commands you will need to run. You can copy and paste these directly during your deployment:

**1. Access the Server**
```bash
ssh your_username@167.172.73.9
```

**2. Navigate to Project Directory**
```bash
cd ~/project
ls -F
```

**3. Build and Run the System**
```bash
docker compose up -d --build
```

**4. Verify Containers are Running**
```bash
docker ps
```

**5. Clean Up (After testing)**
```bash
docker compose down
```

*(Note: A `deploy.sh` script has also been added to the project root which automates the Docker commands for you.)*
