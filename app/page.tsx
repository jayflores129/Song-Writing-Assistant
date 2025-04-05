"use client";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import React, { createRef, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Download,
  Guitar,
  Play,
  Plus,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Tone from "tone";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { salamanderUrls } from "@/lib/instrument_urls";
import MainLayout from "@/components/layout/MainLayout";

const _chords = ["C", "D", "E", "F", "G", "A", "B"];

const itemDnD = {
  CHORD: "chord",
};

type ChordType = {
  name?: string;
  extension?: string;
  beat?: number;
  startAt?: number;
};

function Chord({ name }: { name: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: itemDnD.CHORD,
    item: { name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag as any}
      style={{
        fontWeight: "bold",
        cursor: "move",
      }}
      className={cn(
        "border-r last:border-r-0 text-gray-500 w-[40px] h-[40px] flex items-center gap-2 justify-center hover:bg-accent",
        isDragging && "bg-transparent"
      )}
    >
      <span>{name}</span>
    </div>
  );
}

const ChordDropZone = ({
  onDrop,
  word,
  droppedChord,
  onChangeBeat,
  beat,
  onChangeStartAt,
  startAt,
}: {
  onDrop?: (data: any) => void;
  word: string;
  droppedChord?: any;
  onChangeBeat?: (beat: any) => void;
  beat?: any;
  onChangeStartAt?: (value: number) => void;
  startAt?: number;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: itemDnD.CHORD,
    drop: (item: any) => onDrop && onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop as any}
      className={cn(
        "flex relative h-full transition-[width] duration-300 resize-x",
        isOver && "bg-blue-200",
        (isOver || !word) && "min-w-4",
        droppedChord && !word && "min-w-6"
      )}
    >
      {droppedChord && (
        <Popover>
          <PopoverTrigger asChild>
            <span className="text-[0.7em] bg-gray-200 absolute bottom-[30px] font-bold px-1 font-serif cursor-pointer">
              {droppedChord}
            </span>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            className="drop-shadow-md border-0"
          >
            <div className="flex gap-2">
              <div className="w-1/2 flex flex-col">
                <p>Start At</p>
                <input
                  type="number"
                  value={startAt}
                  onChange={(e: any) =>
                    onChangeStartAt && onChangeStartAt(e.target.value)
                  }
                  className="border p-1 w-full"
                />
              </div>
              <div className="w-1/2 flex flex-col">
                <p>Beats</p>
                <select
                  className="border p-1 w-full"
                  value={beat}
                  onChange={(e) => onChangeBeat && onChangeBeat(e.target.value)}
                >
                  <option value="1">1 beat</option>
                  <option value="2">2 beats</option>
                  <option value="3">3 beats</option>
                  <option value="4">4 beats</option>
                  <option value="5">5 beats</option>
                  <option value="6">6 beats</option>
                </select>
              </div>
            </div>

            <PopoverPrimitive.Arrow
              className="fill-white drop-shadow-md"
              width={20}
              height={10}
            />
          </PopoverContent>
        </Popover>
      )}
      <span>{word}</span>
    </div>
  );
};

export default function Page() {
  const [data, setData] = useState<any>([]);
  useState<[dataKey: number, wordKey: number]>();

  const onChangeInput = (e: any, dataKey: any, workKey?: any) => {
    const splitValue = e.target.value?.split("\n");

    const flatMap = (word: any, key: number, sentenceLength: number) => {
      if (key === sentenceLength - 1) return ["", word, ""];
      return ["", word];
    };

    if (workKey >= 0 && splitValue.length === 1) {
      const _data = [...data];
      const sentences = e.target.value.replace(/\s+/g, " ").trim().split(" ");
      const words = sentences.flatMap((word: any, key: number) =>
        flatMap(word, key, sentences.length)
      );
      _data[dataKey].sentences[workKey].words = words;
      setData(_data);
    }

    if (workKey >= 0) return;

    if (splitValue?.length > 1) {
      const sentences = splitValue.map((sentence: any) => {
        const sentences = sentence.split(" ");
        const words = sentences.flatMap((word: any, key: number) =>
          flatMap(word, key, sentences.length)
        );
        return {
          words,
          ref: createRef(),
        };
      });
      const _data = [...data];
      _data[dataKey].sentences = sentences;
      setData(_data);

      setTimeout(() => {
        if (sentences?.[sentences.length - 1]) {
          sentences?.[sentences.length - 1]?.ref?.current?.click();
        }
      }, 100);
      e.target.value = "";
    }
  };

  const onBlurSentence = (e: any, dataKey: number, wordKey: number) => {
    let _data: any = [...data];
    let sentences = _data[dataKey].sentences;
    if (!e.target.value) {
      sentences?.splice(wordKey, 1);
      setData(_data);
      return;
    }
  };

  const onAddSection = () => {
    const insertData = {
      name: "[Section Name]",
      sentences: [],
      editableRef: createRef<any>(),
    };
    setData((prevData: any) => [...prevData, insertData]);
    setTimeout(() => {
      if (insertData?.editableRef?.current) {
        insertData?.editableRef?.current?.focus();
      }
    });
  };

  const onDropChord = (
    dropItem: any,
    dataKey: number,
    sentenceKey: number,
    wordKey: number
  ) => {
    setData((prevData: any) => {
      const newData = [...prevData];

      const sentence = newData[dataKey]?.sentences?.[sentenceKey];
      if (!sentence || !Array.isArray(sentence.words)) return prevData;

      sentence.chords = sentence.chords
        ? [...sentence.chords]
        : Array(sentence.words.length).fill(undefined);

      sentence.chords[wordKey] = {
        name: dropItem?.name,
        extension: [],
        beat: 4,
        startAt: 0,
      };

      return newData;
    });
  };

  const onChangeBeat = (
    beat: any,
    dataKey: number,
    sentenceKey: number,
    chordKey: number
  ) => {
    setData((prevData: any) => {
      const newData = [...prevData];

      const sentence = newData[dataKey]?.sentences?.[sentenceKey];
      if (!sentence || !Array.isArray(sentence.words)) return prevData;

      sentence.chords = sentence.chords
        ? [...sentence.chords]
        : Array(sentence.words.length).fill(undefined);

      const chords: ChordType[] = sentence.chords;

      chords[chordKey] = {
        ...chords[chordKey],
        beat,
      };

      return newData;
    });
  };

  const onChangeStartAt = (
    startAt: any,
    dataKey: number,
    sentenceKey: number,
    chordKey: number
  ) => {
    setData((prevData: any) => {
      const newData = [...prevData];

      const sentence = newData[dataKey]?.sentences?.[sentenceKey];
      if (!sentence || !Array.isArray(sentence.words)) return prevData;

      sentence.chords = sentence.chords
        ? [...sentence.chords]
        : Array(sentence.words.length).fill(undefined);

      const chords: ChordType[] = sentence.chords;

      chords[chordKey] = {
        ...chords[chordKey],
        startAt,
      };

      return newData;
    });
  };

  console.log(data);

  return (
    <MainLayout>
      <DndProvider backend={HTML5Backend}>
        <div className="flex p-[15px] gap-3 pe-3">
          <div className="min-h-[calc(100vh-var(--header-height)-30px)] bg-white w-[calc(100%-500px)] shadow rounded">
            <div className="p-4 border-b flex items-center justify-between">
              <p className="font-medium flex gap-1">
                <span className="text-indigo-500">Title:</span>
                <span>Forever Young</span>
              </p>
              <div className="flex items-center gap-1">
                <Button variant={"ghost"} size="sm">
                  <Download width={16} height={16} />
                </Button>
                <Button size={"sm"} variant="secondary">
                  Save
                </Button>
              </div>
            </div>
            <div className="flex items-center p-4 gap-3">
              <div>
                <button
                  className="border border-red-300 text-red-300 hover:bg-red-300 group p-2 hover:drop-shadow-lg w-[40px] h-[40px]"
                  type="button"
                  onClick={async () => {
                    const sampler = new Tone.Sampler({
                      urls: salamanderUrls,
                      release: 1,
                      baseUrl: "https://tonejs.github.io/audio/salamander/",
                    }).toDestination();

                    Tone.loaded().then(() => {
                      const chords = data
                        ?.flatMap((d: any) => {
                          const chords: ChordType[] = d?.sentences?.flatMap(
                            (s: any) => s.chords
                          );
                          return Array.isArray(chords) ? chords : [];
                        })
                        .filter(Boolean);

                      const transport = Tone.getTransport();

                      const part = new Tone.Part(
                        (time, chord) => {
                          const note = `${chord.name}3`;
                          const duration = chord.beat;

                          sampler.triggerAttackRelease(note, duration, time);
                        },
                        chords.map((chord: ChordType) => [chord.startAt, chord])
                      );

                      part.start(0);
                      transport.start();
                    });
                  }}
                >
                  <Play strokeWidth={1.5} className="group-hover:text-white" />
                </button>
              </div>
              <div className="flex flex-items border">
                {_chords.map((chord: any, key: number) => (
                  <Chord name={chord} key={key} />
                ))}
              </div>
            </div>

            <div className="content px-4 py-3">
              {Array.isArray(data) &&
                data.map((item: any, key: number) => (
                  <div key={key} className="flex flex-col group">
                    <div
                      contentEditable
                      className="capitalize w-fit ms-[20px] group-first:mt-6 mt-7 mb-6"
                      onBlur={(e) => {
                        const value = e.currentTarget.textContent;
                        setData((prevData: any) => {
                          const newData = [...prevData];
                          newData[key].name = value;
                          return newData;
                        });
                      }}
                      dangerouslySetInnerHTML={{
                        __html: item.name,
                      }}
                    />
                    <div className="flex flex-col gap-3">
                      {Array.isArray(item.sentences) &&
                        item.sentences.map(
                          (sentence: any, sentenceKey: number) => (
                            <React.Fragment key={sentenceKey}>
                              <div
                                ref={sentence.ref}
                                className="h-[32px] flex items-start px-[4px]"
                              >
                                {Array.isArray(sentence?.words) &&
                                  sentence.words.map(
                                    (word: any, wordKey: number) => {
                                      const chord: ChordType =
                                        sentence?.chords?.[wordKey];

                                      return (
                                        <React.Fragment key={wordKey}>
                                          <ChordDropZone
                                            word={word}
                                            beat={chord?.beat}
                                            startAt={chord?.startAt}
                                            droppedChord={chord?.name}
                                            onChangeStartAt={(startAt) =>
                                              onChangeStartAt(
                                                startAt,
                                                key,
                                                sentenceKey,
                                                wordKey
                                              )
                                            }
                                            onChangeBeat={(beat) =>
                                              onChangeBeat(
                                                beat,
                                                key,
                                                sentenceKey,
                                                wordKey
                                              )
                                            }
                                            onDrop={(dropItem) => {
                                              onDropChord(
                                                dropItem,
                                                key,
                                                sentenceKey,
                                                wordKey
                                              );
                                            }}
                                          />
                                        </React.Fragment>
                                      );
                                    }
                                  )}
                              </div>
                            </React.Fragment>
                          )
                        )}
                    </div>
                    {item.sentences?.length === 0 && (
                      <textarea
                        ref={item.editableRef}
                        onChange={(e) => onChangeInput(e, key)}
                        className={cn(
                          "bg-gray-100 rounded-md px-3 h-[36px] leading-9 resize-none flex items-center"
                        )}
                        placeholder="Enter lyrics here"
                      />
                    )}
                  </div>
                ))}
              <div className="flex items-center gap-2 mt-2 px-3">
                <button
                  type="button"
                  onClick={onAddSection}
                  className="flex items-center gap-2 hover:bg-orange-100 border-orange-200 border w-fit px-2 pe-3 py-1 rounded-2xl"
                >
                  <div className="rounded-full bg-orange-300 w-fit p-1">
                    <Plus strokeWidth={1} width={15} height={15} />
                  </div>
                  <p className="text-[0.85em]">Section</p>
                </button>
                <button className="flex items-center gap-2 hover:bg-red-100 border-red-200 border w-fit px-2 pe-3 py-1 rounded-2xl">
                  <div className="rounded-full bg-red-300 w-fit p-1">
                    <Guitar strokeWidth={1} width={15} height={15} />
                  </div>
                  <p className="text-[0.85em]">Instrumental</p>
                </button>
              </div>
            </div>
          </div>
          <div className="bg-white rounded shadow w-[500px] min-h-[calc(100vh-var(--header-height)-30px)]"></div>
        </div>
      </DndProvider>
    </MainLayout>
  );
}
