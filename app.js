import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const oneMBData = Buffer.alloc(1024 * 1024, "x").toString();
fs.writeFileSync("output.txt", "");

app.get("/main", (_, res) => {
  console.log("GET on /main");
  res.sendFile(__dirname + "/index.html");
});

app.get("/data_:id.txt", (req, res) => {
  fs.appendFileSync("output.txt", `${req.params.id}\n`, (err) => {
    if (err) {
      console.error("Failed to write to output.txt", err);
    }
  });
  res.set({
    "Content-Disposition": `attachment; filename=data_${req.params.id}.txt`,
  });
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
  res.status(200).send(oneMBData);
});

app.get("*", async (req, res) => {
  const pathRegex = /^\/page_(\d+)$/;
  const match = req.path.match(pathRegex);
  const numObjs = 100;

  if (match) {
    const id = parseInt(match[1], 10);
    const reverse = req.query.reverse === "true";
    const nextId = reverse ? id - 1 : id + 1;
    const condition = reverse ? nextId > 0 : nextId <= numObjs;
    const nextPage = `/page_${nextId}${reverse ? "?reverse=true" : ""}`;

    const delay = 100;

    const script = `<script>
      window.onload = async () => {
        await fetch("/data_${id}.txt");
        setTimeout(() => {
          if (${condition}) {
            window.location.href = "${nextPage}";
          }
          else if (${id} === ${numObjs} && !${reverse}) {
            window.location.href = "/page_${numObjs}?reverse=true";
          }
        }, ${delay});
      }
    </script>`;

    res.send(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Page ${id}</title></head><body>${script}</body></html>`
    );
  } else {
    res.status(404).send("Page not found");
  }
});

app.listen(5003, () => {
  console.log("Server started on port 5003.");
});
